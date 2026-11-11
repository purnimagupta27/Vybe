import { Router, type NextFunction, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import multer from "multer";
import db from "../index.js";
import { user } from "../db/auth-schema.js";
import { uploadProfilePhoto } from "../lib/cloudinary.js";
import { isAllowedPhoto, MAX_PHOTO_BYTES } from "../lib/photo-rules.js";
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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PHOTO_BYTES },
});

const uploadSingle = (req: Request, res: Response, next: NextFunction) => {
  upload.single("photo")(req, res, (error) => {
    if (error) {
      res.status(400).json({
        status: "error",
        message: "Photo must be JPEG, PNG, or WebP under 5 MB.",
      });
      return;
    }
    next();
  });
};

profileRouter.post("/photo", uploadSingle, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: "error", message: "Photo is required." });
    }
    if (!isAllowedPhoto(req.file.mimetype)) {
      return res.status(400).json({
        status: "error",
        message: "Photo must be JPEG, PNG, or WebP.",
      });
    }

    const url = await uploadProfilePhoto(req.file.buffer);
    await db.update(user).set({ image: url }).where(eq(user.id, req.user!.id));

    return res.status(200).json({ status: "success", data: { url } });
  } catch (error) {
    console.error("Profile photo upload error:", error);
    return res.status(500).json({
      status: "error",
      message: "Could not upload the photo. Please try again.",
    });
  }
});

export default profileRouter;
