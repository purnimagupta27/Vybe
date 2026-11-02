import { Router, type Request, type Response } from "express";
import db from "../index.js";
import { connectionRequest } from "../db/connectionRequest-schema.js";
import { user } from "../db/auth-schema.js";
import { and, eq, notInArray, or } from "drizzle-orm"
import z from "zod"

const userRouter: Router = Router()

// GET /api/user/requests/received
// Returns the PENDING connection requests sent to the logged-in user
// (status "interested" — the only ones they can accept/reject via the review API),
// along with the helpful details of each sender so the UI can render the cards.
// Sender's id is what the frontend passes as :requestId to /api/request/review
// (the review API matches on fromUserId), so it is always included.
userRouter.get("/requests/received", async (req: Request, res: Response) => {
  try {
    const loggedInUserId = req.user?.id

    if (!loggedInUserId) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const pendingRequests = await db
      .select({
        requestId: connectionRequest.id,
        status: connectionRequest.status,
        createdAt: connectionRequest.createdAt,
        sender: {
          id: user.id,
          name: user.name,
          lastName: user.lastName,
          image: user.image,
          gender: user.gender,
          age: user.age,
          about: user.about,
          favSingers: user.favSingers,
        },
      })
      .from(connectionRequest)
      .innerJoin(user, eq(user.id, connectionRequest.fromUserId))
      .where(
        and(
          eq(connectionRequest.toUserId, loggedInUserId),
          eq(connectionRequest.status, "interested"),
        ),
      )

    return res.status(200).json({
      status: "success",
      message: "Pending connection requests fetched successfully",
      data: pendingRequests.map((request) => ({
        ...request,
        // Stay consistent with /api/profile/view: unset singers are an empty
        // array, not null, so the frontend can iterate without null-checks.
        sender: {
          ...request.sender,
          favSingers: request.sender.favSingers ?? [],
        },
      })),
    })
  }
  catch (error) {
    console.error("Get connection requests error:", error)
    return res.status(500).json({
      status: "error",
      message:
        "Something went wrong while fetching connection requests. Please try again.",
    })
  }
})



// GET /api/user/connections
// Returns the users the logged-in user is CONNECTED with — i.e. rows whose
// status is "accepted" — regardless of who sent the request (either direction).
// Only the OTHER user's details are returned, never the connection row details.
userRouter.get("/connections", async (req: Request, res: Response) => {
  try {
    const loggedInUserId = req.user?.id

    if (!loggedInUserId) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const connectionFields = {
      id: user.id,
      name: user.name,
      lastName: user.lastName,
      image: user.image,
      gender: user.gender,
      age: user.age,
      about: user.about,
      favSingers: user.favSingers,
    }

    // Accepted requests the logged-in user SENT — the other party is to_user_id.
    const iSent = await db
      .select(connectionFields)
      .from(connectionRequest)
      .innerJoin(user, eq(user.id, connectionRequest.toUserId))
      .where(
        and(
          eq(connectionRequest.fromUserId, loggedInUserId),
          eq(connectionRequest.status, "accepted"),
        ),
      )

    // Accepted requests the logged-in user RECEIVED — the other party is from_user_id.
    const iReceived = await db
      .select(connectionFields)
      .from(connectionRequest)
      .innerJoin(user, eq(user.id, connectionRequest.fromUserId))
      .where(
        and(
          eq(connectionRequest.toUserId, loggedInUserId),
          eq(connectionRequest.status, "accepted"),
        ),
      )

    // A pair can only ever have one request row (unique constraint), so the
    // merged list cannot contain duplicates. Sorted alphabetically for a stable UI.
    const connections = [...iSent, ...iReceived]
      .map((connection) => ({
        ...connection,
        favSingers: connection.favSingers ?? [],
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return res.status(200).json({
      status: "success",
      message: "Connections fetched successfully",
      data: connections,
    })
  }
  catch (error) {
    console.error("Get connections error:", error)
    return res.status(500).json({
      status: "error",
      message:
        "Something went wrong while fetching connections. Please try again.",
    })
  }
})

// GET /api/user/feed?page=1
// Returns the users that can appear on the logged-in user's discovery cards:
//   • Everyone EXCEPT the logged-in user themselves
//   • AND no user who already has a connectionRequest row with them (either
//     direction, any status) — pending/ignored/accepted users are all excluded
//     because there is nothing new to decide or send to them from the feed.
// Paginated: FEED_PAGE_SIZE users per page, ?page=N (default 1).
// Results are ordered by name so paging is stable across requests.
userRouter.get("/feed", async (req: Request, res: Response) => {
  try {
    const loggedInUserId = req.user?.id

    if (!loggedInUserId) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const feedQuerySchema = z.object({
      page: z.coerce.number().int().min(1).default(1),
    })
    const parsedQuery = feedQuerySchema.safeParse(req.query)
    if (!parsedQuery.success) {
      return res
        .status(400)
        .json({ message: "Invalid 'page' query param. It must be a positive whole number." })
    }

    const page = parsedQuery.data.page
    const pageSize = 10 // per requirement: show 10 users at a time

    // Collect every user id that already shares a connectionRequest row
    // with the logged-in user (as sender or receiver, of any status).
    const relatedRequests = await db
      .select({
        fromUserId: connectionRequest.fromUserId,
        toUserId: connectionRequest.toUserId,
      })
      .from(connectionRequest)
      .where(
        or(
          eq(connectionRequest.fromUserId, loggedInUserId),
          eq(connectionRequest.toUserId, loggedInUserId),
        ),
      )

    const excludedUserIds = new Set([loggedInUserId])
    for (const request of relatedRequests) {
      excludedUserIds.add(request.fromUserId)
      excludedUserIds.add(request.toUserId)
    }

    // Fetch one extra row to know whether a next page exists,
    // without paying for a separate COUNT(*) query.
    const feedRows = await db
      .select({
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        image: user.image,
        gender: user.gender,
        age: user.age,
        about: user.about,
        favSingers: user.favSingers,
      })
      .from(user)
      .where(notInArray(user.id, [...excludedUserIds]))
      .orderBy(user.name, user.id)
      .limit(pageSize + 1)
      .offset((page - 1) * pageSize)

    const hasMore = feedRows.length > pageSize
    const feedUsers = feedRows.slice(0, pageSize)

    return res.status(200).json({
      status: "success",
      message: "Feed fetched successfully",
      data: feedUsers.map(({ favSingers, ...feedUser }) => ({
        ...feedUser,
        favSingers: favSingers ?? [],
      })),
      pagination: {
        page,
        pageSize,
        hasMore,
      },
    })
  }
  catch (error) {
    console.error("Get feed error:", error)
    return res.status(500).json({
      status: "error",
      message:
        "Something went wrong while fetching the feed. Please try again.",
    })
  }
})

export default userRouter