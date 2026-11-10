import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import db from "../index.js";
import { user } from "../db/auth-schema.js";
import { isProfileComplete } from "../lib/profile-completeness.js";

export const requireCompleteProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ status: "error", message: "Unauthorized." });
      return;
    }

    const [profile] = await db
      .select({ onboardingCompletedAt: user.onboardingCompletedAt })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!profile) {
      res.status(401).json({ status: "error", message: "Unauthorized." });
      return;
    }

    if (!isProfileComplete(profile)) {
      res.status(403).json({
        status: "error",
        message: "Complete your profile before using this feature.",
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Complete profile middleware error:", error);
    res.status(500).json({ status: "error", message: "Something went wrong." });
  }
};
