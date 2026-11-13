import { Router, type NextFunction, type Request, type Response } from "express";
import { and, eq, isNotNull } from "drizzle-orm";
import multer from "multer";
import db from "../index.js";
import { user } from "../db/auth-schema.js";
import { profileSong } from "../db/profileSong-schema.js";
import { buildAudiusStreamUrl, getAudiusTrack } from "../lib/audius.js";
import { isCloudinaryConfigured, uploadProfilePhoto } from "../lib/cloudinary.js";
import { isAllowedPhoto, MAX_PHOTO_BYTES } from "../lib/photo-rules.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  completeProfileSchema,
  editProfileSchema,
  type CompleteProfileInput,
  type EditProfileInput,
} from "../validations/profile.validation.js";

const profileRouter: Router = Router();

// `editProfileSchema` accepts an explicit `null` to clear a field, but every
// editable column is NOT NULL and the guard below refuses nulls once the
// profile is complete. This narrows the validated body to the shape the
// `user` table can actually store.
type ProfileUpdates = {
  [K in Exclude<keyof EditProfileInput, "song" | "email">]?: NonNullable<EditProfileInput[K]>;
};

profileRouter.get("/view", async (req: Request, res: Response) => {
  try {
    const [row] = await db
      .select({
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        image: user.image,
        gender: user.gender,
        age: user.age,
        city: user.city,
        about: user.about,
        favSingers: user.favSingers,
        onboardingCompletedAt: user.onboardingCompletedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        songProvider: profileSong.provider,
        songTrackId: profileSong.providerTrackId,
        songTitle: profileSong.title,
        songArtist: profileSong.artist,
        songArtworkUrl: profileSong.artworkUrl,
        songDurationSeconds: profileSong.durationSeconds,
        songStory: profileSong.story,
      })
      .from(user)
      .leftJoin(profileSong, eq(profileSong.userId, user.id))
      .where(eq(user.id, req.user!.id))
      .limit(1);

    if (!row) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Profile fetched successfully",
      data: {
        id: row.id,
        name: row.name,
        lastName: row.lastName ?? null,
        email: row.email,
        image: row.image ?? null,
        gender: row.gender ?? null,
        age: row.age ?? null,
        city: row.city ?? null,
        about: row.about ?? null,
        favSingers: row.favSingers ?? [],
        onboardingCompletedAt: row.onboardingCompletedAt ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        song:
          row.songTrackId === null
            ? null
            : {
                provider: row.songProvider!,
                providerTrackId: row.songTrackId,
                title: row.songTitle!,
                artist: row.songArtist!,
                artworkUrl: row.songArtworkUrl,
                durationSeconds: row.songDurationSeconds,
                story: row.songStory!,
                streamUrl: buildAudiusStreamUrl(row.songTrackId),
              },
      },
    });
  } catch (error) {
    console.error("Profile view error:", error);
    return res.status(500).json({
      status: "error",
      message: "Could not load the profile. Please try again.",
    });
  }
});

// GET /api/profile/:userId
// Another user's profile, as seen by the logged-in user. Same public shape as
// the discover feed: email and every other private column stay out. Only
// completed profiles are viewable, so a half-onboarded user is a 404 rather
// than a page of empty fields.
profileRouter.get("/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    if (typeof userId !== "string" || userId.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "A user id is required.",
      });
    }

    const [row] = await db
      .select({
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        image: user.image,
        gender: user.gender,
        age: user.age,
        city: user.city,
        about: user.about,
        favSingers: user.favSingers,
        songTrackId: profileSong.providerTrackId,
        songTitle: profileSong.title,
        songArtist: profileSong.artist,
        songArtworkUrl: profileSong.artworkUrl,
        songDurationSeconds: profileSong.durationSeconds,
        songStory: profileSong.story,
      })
      .from(user)
      .leftJoin(profileSong, eq(profileSong.userId, user.id))
      .where(and(eq(user.id, userId), isNotNull(user.onboardingCompletedAt)))
      .limit(1);

    if (!row) {
      return res.status(404).json({
        status: "error",
        message: "Profile not found.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Profile fetched successfully",
      data: {
        id: row.id,
        name: row.name,
        lastName: row.lastName ?? null,
        gender: row.gender ?? null,
        age: row.age ?? null,
        image: row.image ?? null,
        city: row.city ?? null,
        about: row.about ?? null,
        favSingers: row.favSingers ?? [],
        song:
          row.songTrackId === null
            ? null
            : {
                title: row.songTitle!,
                artist: row.songArtist!,
                artworkUrl: row.songArtworkUrl,
                durationSeconds: row.songDurationSeconds,
                story: row.songStory!,
                streamUrl: buildAudiusStreamUrl(row.songTrackId),
              },
      },
    });
  } catch (error) {
    console.error("Public profile view error:", error);
    return res.status(500).json({
      status: "error",
      message: "Could not load that profile. Please try again.",
    });
  }
});

profileRouter.patch("/edit", validate(editProfileSchema), async (req: Request, res: Response) => {
  try {
    const currentUser = req.user!;

    // After validation, req.body only contains the editable fields the user
    // actually sent. Email and other protected fields are rejected by the schema.
    // The song lives in its own table, so it is lifted out before the user row
    // is updated. `profileUpdates` is what actually maps onto the `user` table.
    const { song, ...profileUpdates } = req.body as EditProfileInput;

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No fields provided to update",
      });
    }

    // Every onboarding field is compulsory. Once the profile is complete, a
    // user can edit a field but cannot clear it. `undefined` means "not sent"
    // and is not treated as an attempt to clear anything.
    const [current] = await db
      .select({ onboardingCompletedAt: user.onboardingCompletedAt })
      .from(user)
      .where(eq(user.id, currentUser.id))
      .limit(1);

    if (current?.onboardingCompletedAt) {
      const requiredKeys = ["name", "lastName", "gender", "age", "city", "about", "favSingers"] as const;

      for (const key of requiredKeys) {
        const value = (profileUpdates as Record<string, unknown>)[key];
        const isEmpty =
          value === null ||
          value === "" ||
          (Array.isArray(value) && value.length === 0);

        if (isEmpty) {
          return res.status(400).json({
            status: "error",
            message: "Completed profile fields cannot be cleared.",
          });
        }
      }
    }

    if (song) {
      // Re-resolve the track so a song deleted on Audius cannot be saved, the
      // same rule the complete-profile endpoint applies.
      const track = await getAudiusTrack(song.trackId);
      if (!track) {
        return res.status(400).json({
          status: "error",
          message: "That song is no longer available. Please pick another one.",
        });
      }

      // Retryable by design: song first, then the user row. Neon's HTTP driver
      // has no transaction to wrap these in.
      await db
        .insert(profileSong)
        .values({
          userId: currentUser.id,
          provider: "audius",
          providerTrackId: track.id,
          title: track.title,
          artist: track.artist,
          artworkUrl: track.artworkUrl,
          durationSeconds: track.durationSeconds,
          story: song.story,
        })
        .onConflictDoUpdate({
          target: profileSong.userId,
          set: {
            provider: "audius",
            providerTrackId: track.id,
            title: track.title,
            artist: track.artist,
            artworkUrl: track.artworkUrl,
            durationSeconds: track.durationSeconds,
            story: song.story,
          },
        });
    }

    // A song-only edit must not emit an empty `update ... set`.
    if (Object.keys(profileUpdates).length > 0) {
      const [updatedUser] = await db
        .update(user)
        .set(profileUpdates as ProfileUpdates)
        .where(eq(user.id, currentUser.id))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
        });
      }
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

profileRouter.post("/complete", validate(completeProfileSchema), async (req: Request, res: Response) => {
  try {
    const input = req.body as CompleteProfileInput;
    const userId = req.user!.id;

    // The photo has to already exist on Cloudinary — Google's photo is never
    // stored, so this is the only proof that the user uploaded one.
    const [current] = await db
      .select({ image: user.image })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!current?.image?.startsWith("https://res.cloudinary.com/")) {
      return res.status(400).json({
        status: "error",
        message: "Upload a profile photo before finishing.",
      });
    }

    // Re-resolve the track so a deleted or unstreamable song cannot be saved.
    const track = await getAudiusTrack(input.song.trackId);
    if (!track) {
      return res.status(400).json({
        status: "error",
        message: "That song is no longer available. Please pick another one.",
      });
    }

    // Retryable by design: the song row is upserted first, then the user is
    // marked complete. Neon's HTTP driver has no transaction to wrap these in.
    await db
      .insert(profileSong)
      .values({
        userId,
        provider: "audius",
        providerTrackId: track.id,
        title: track.title,
        artist: track.artist,
        artworkUrl: track.artworkUrl,
        durationSeconds: track.durationSeconds,
        story: input.song.story,
      })
      .onConflictDoUpdate({
        target: profileSong.userId,
        set: {
          provider: "audius",
          providerTrackId: track.id,
          title: track.title,
          artist: track.artist,
          artworkUrl: track.artworkUrl,
          durationSeconds: track.durationSeconds,
          story: input.song.story,
        },
      });

    await db
      .update(user)
      .set({
        name: input.name,
        lastName: input.lastName,
        gender: input.gender,
        age: input.age,
        city: input.city,
        about: input.about,
        favSingers: input.favSingers,
        onboardingCompletedAt: new Date(),
      })
      .where(eq(user.id, userId));

    return res.status(200).json({ status: "success" });
  } catch (error) {
    console.error("Complete profile error:", error);
    return res.status(500).json({
      status: "error",
      message: "Could not finish your profile. Please try again.",
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
    if (!req.file || req.file.size === 0) {
      return res.status(400).json({ status: "error", message: "Photo is required." });
    }
    if (!isAllowedPhoto(req.file.mimetype)) {
      return res.status(400).json({
        status: "error",
        message: "Photo must be JPEG, PNG, or WebP.",
      });
    }

    if (!isCloudinaryConfigured()) {
      console.error(
        "Profile photo upload error: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET is missing.",
      );
      return res.status(503).json({
        status: "error",
        message:
          "Photo uploads are not configured on the server. Add the CLOUDINARY_* values to backend/.env and restart.",
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
