import { Router, type Request, type Response } from "express";
import db from "../index.js";
import { connectionRequest } from "../db/connectionRequest-schema.js";
import { sendStatusSchema, reviewStatusSchema } from "../validations/connectionRequest.validation.js";
import { and, eq, or } from "drizzle-orm";

const requestRouter: Router = Router();

requestRouter.post("/send/:status/:toUserId", async (req: Request, res: Response) => {
    try {
      const fromUserId = req.user?.id;
      const toUserId = req.params.toUserId;

      const parsedStatus = sendStatusSchema.safeParse(req.params.status);
      if (!parsedStatus.success) {
        return res
          .status(400)
          .json({ message: "Sender can only send 'interested' or 'ignored'" });
      }

      const status = parsedStatus.data;
      
      if (!fromUserId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (typeof toUserId !== "string" || !toUserId) {
        return res.status(400).json({ message: "Invalid recipient ID" });
      }

      if(fromUserId === toUserId){
        return res.json({message: `You cannot mark yourself as ${status}`})
      }

      const [existingConnectionRequest] = await db
        .select()
        .from(connectionRequest)
        .where(
          or(
            and(
              eq(connectionRequest.fromUserId, fromUserId),
              eq(connectionRequest.toUserId, toUserId),
            ),
            and(
              eq(connectionRequest.fromUserId, toUserId),
              eq(connectionRequest.toUserId, fromUserId),
            ),
          ),
        );

      if (existingConnectionRequest) {
        return res.json({
          message: "Connection request already exists",
        });
      }

      await db.insert(connectionRequest).values({
        fromUserId,
        toUserId,
        status,
      });

      res.status(201).json({
        message: `User marked as ${status}.`,
      });
    } 
    catch (error) {
      console.error("Connection request error:", error);
      return res.status(500).json({
        status: "error",
        message:
          "Something went wrong while sending connection request. Please try again.",
      });
    }
  },
);

// Review a connection request the logged-in user RECEIVED: accept or reject it.
// All three guards are enforced atomically in the WHERE clause:
//   1. The request id must match the one in the URL.
//   2. The request must have been sent TO the logged-in user (to_user_id check) —
//      a user can never accept/reject a request they did not receive.
//   3. The request must still be "interested" (pending) — a decided request
//      cannot be decided again, and ignored/accepted/rejected ones are off-limits.
requestRouter.post("/review/:status/:requestId", async (req: Request, res: Response) => {
  try {
    const loggedInUserId = req.user?.id;
    const requestId = req.params.requestId;

    if (!loggedInUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (typeof requestId !== "string" || !requestId) {
      return res.status(400).json({ message: "Invalid request ID" });
    }

    const parsedStatus = reviewStatusSchema.safeParse(req.params.status);
    if (!parsedStatus.success) {
      return res
        .status(400)
        .json({ message: "Reviewer can only respond with 'accepted' or 'rejected'" });
    }

    const status = parsedStatus.data;

    const [updatedRequest] = await db
      .update(connectionRequest)
      .set({ status })
      .where(
        and(
          eq(connectionRequest.fromUserId, requestId),
          eq(connectionRequest.toUserId, loggedInUserId),
          eq(connectionRequest.status, "interested"),
        ),
      )
      .returning({ id: connectionRequest.id, status: connectionRequest.status });

    if (!updatedRequest) {
      return res.status(404).json({
        status: "error",
        message:
          "No pending 'interested' request found for you with the given ID. You can only accept or reject a request that was sent to you and is still pending.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: `Connection request ${status}.`,
      data: updatedRequest,
    });
  } 
  catch (error) {
    console.error("Connection request review error:", error);
    return res.status(500).json({
      status: "error",
      message:
        "Something went wrong while reviewing the connection request. Please try again.",
    });
  }
});

export default requestRouter;
