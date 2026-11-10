import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import db from "../index.js";
import { user } from "../db/auth-schema.js";
import { validate } from "../middleware/validate.middleware.js";
import { editProfileSchema } from "../validations/profile.validation.js";

const profileRouter: Router = Router();

profileRouter.get("/view", (req: Request, res: Response) => {
  const user = req.user!;

  return res.status(200).json({
    status: "success",
    message: "Profile fetched successfully",
    data: {
      id: user.id,
      name: user.name,
      lastName: user.lastName ?? null,
      email: user.email,
      image: user.image ?? null,
      gender: user.gender ?? null,
      age: user.age ?? null,
      about: user.about ?? null,
      favSingers: user.favSingers ?? [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});

profileRouter.patch("/edit", validate(editProfileSchema), async (req: Request, res: Response) => {
  try {
    const currentUser = req.user!;

    // After validation, req.body only contains the editable fields the user
    // actually sent. Email and other protected fields are rejected by the schema.
    const updates = req.body;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No fields provided to update",
      });
    }

    const [updatedUser] = await db
      .update(user)
      .set(updates)
      .where(eq(user.id, currentUser.id))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully."
    });
  } catch (error) {
    console.error("Edit profile error:", error);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong while updating the profile. Please try again.",
    });
  }
});

export default profileRouter;
