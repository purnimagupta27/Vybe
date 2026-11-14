import { Router, type Request, type Response } from "express";
import db from "../index.js";
import { connectionRequest } from "../db/connectionRequest-schema.js";
import { user } from "../db/auth-schema.js";
import { and, desc, eq, or } from "drizzle-orm"

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

// GET /api/user/friends
// The logged-in user's accepted connections, from EITHER direction: rows they
// sent that were accepted, and rows they received and accepted. One row per
// pair (unique constraint), so nobody can appear twice.
// `/connections` above already returns a similar list; this one is what the
// Friends tab consumes, and it also returns the total in `count`.
userRouter.get("/friends", async (req: Request, res: Response) => {
  try {
    const loggedInUserId = req.user?.id

    if (!loggedInUserId) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const friends = await db
      .select({
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        image: user.image,
        gender: user.gender,
        age: user.age,
        about: user.about,
        favSingers: user.favSingers,
        // When the request was accepted. updatedAt moves with the status change.
        connectedAt: connectionRequest.updatedAt,
      })
      .from(connectionRequest)
      // Join the OTHER side of the row, whichever side the viewer is on.
      .innerJoin(
        user,
        or(
          and(
            eq(connectionRequest.fromUserId, loggedInUserId),
            eq(user.id, connectionRequest.toUserId),
          ),
          and(
            eq(connectionRequest.toUserId, loggedInUserId),
            eq(user.id, connectionRequest.fromUserId),
          ),
        ),
      )
      .where(eq(connectionRequest.status, "accepted"))
      .orderBy(desc(connectionRequest.updatedAt))

    const withSingers = friends.map((friend) => ({
      ...friend,
      // Same convention as the other endpoints: unset singers are [] not null.
      favSingers: friend.favSingers ?? [],
    }))

    return res.status(200).json({
      status: "success",
      message: "Friends fetched successfully",
      count: withSingers.length,
      data: withSingers,
    })
  }
  catch (error) {
    console.error("Get friends error:", error)
    return res.status(500).json({
      status: "error",
      message:
        "Something went wrong while fetching your friends. Please try again.",
    })
  }
})

export default userRouter