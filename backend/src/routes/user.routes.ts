import { Router, type Request, type Response } from "express";
import db from "../index.js";
import { connectionRequest } from "../db/connectionRequest-schema.js";
import { user } from "../db/auth-schema.js";
import { and, eq } from "drizzle-orm"

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


export default userRouter