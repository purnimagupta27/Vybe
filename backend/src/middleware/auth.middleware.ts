import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";

export type AuthSession = typeof auth.$Infer.Session;

declare global {
  namespace Express {
    interface Request {
      user?: AuthSession["user"];
      session?: AuthSession["session"];
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({
        status: "error",
        message: "Unauthorized. Please sign in to continue.",
      });
      return;
    }

    req.user = session.user;
    req.session = session.session;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({
      status: "error",
      message: "Unauthorized. Invalid or expired session.",
    });
  }
};
