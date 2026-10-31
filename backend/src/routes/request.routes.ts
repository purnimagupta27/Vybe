import { Router, type Request, type Response } from "express";
import db from "../index.js";
import { connectionRequest } from "../db/connectionRequest-schema.js";
import { connectionStatusSchema } from "../validations/connectionRequest.validation.js";
import { and, eq, or } from "drizzle-orm";

const requestRouter: Router = Router();

requestRouter.post("/send/:status/:toUserId", async (req: Request, res: Response) => {
    try {
      const fromUserId = req.user?.id;
      const toUserId = req.params.toUserId;

      const parsedStatus = connectionStatusSchema.safeParse(req.params.status);
      if (!parsedStatus.success) {
        return res.status(400).json({ message: "Invalid connection status" });
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

export default requestRouter;
