import { Router, type Request, type Response } from "express";
import { and, desc, eq, isNotNull, ne, notExists, or, sql } from "drizzle-orm";
import db from "../index.js";
import { user } from "../db/auth-schema.js";
import { profileSong } from "../db/profileSong-schema.js";
import { connectionRequest } from "../db/connectionRequest-schema.js";
import { buildAudiusStreamUrl } from "../lib/audius.js";
import { feedQuerySchema } from "../validations/feed.validation.js";

const feedRouter: Router = Router();

// Only what the photo-first card renders; email and other private columns stay out.
const profileColumns = {
  id: user.id,
  name: user.name,
  lastName: user.lastName,
  gender: user.gender,
  age: user.age,
  image: user.image,
  city: user.city,
  about: user.about,
  favSingers: user.favSingers,
  songProvider: profileSong.provider,
  songTrackId: profileSong.providerTrackId,
  songTitle: profileSong.title,
  songArtist: profileSong.artist,
  songArtworkUrl: profileSong.artworkUrl,
  songDurationSeconds: profileSong.durationSeconds,
  songStory: profileSong.story,
};

// GET /api/feed?cursor=<lastSeenUserId>&limit=10
// A stable, cursor-paginated list of profiles the viewer has not acted on yet.
// Cursor over offset on purpose: every swipe inserts a connectionRequest row that
// must be excluded from later pages, so an offset window would shift and the feed
// would skip or repeat people. Ordering is (created_at, id) DESC, and the cursor
// is resolved to its exact timestamp so no precision is lost around page edges.
feedRouter.get("/", async (req: Request, res: Response) => {
  const parsed = feedQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid feed query.",
    });
  }

  const viewerId = req.user?.id;
  if (!viewerId) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }

  const { cursor, limit } = parsed.data;

  try {
    // The cursor is the id of the last profile already shown. The anchor row is
    // resolved inside SQL: round-tripping its timestamp through a JS Date would
    // truncate Postgres microseconds and could skip a row at the page edge.
    // Ordering is (created_at, id) DESC, so the tuple comparison below resumes
    // exactly where the previous page stopped. An unknown cursor yields no rows,
    // which reads as the end of the feed.
    const afterCursor = cursor
      ? sql`(${user.createdAt}, ${user.id}) < (
          select ${user.createdAt}, ${user.id} from ${user} where ${user.id} = ${cursor}
        )`
      : undefined;

    // Exclude anyone the viewer already swiped on, in either direction.
    const notYetDecided = notExists(
      db
        .select({ one: sql`1` })
        .from(connectionRequest)
        .where(
          or(
            and(
              eq(connectionRequest.fromUserId, viewerId),
              eq(connectionRequest.toUserId, user.id),
            ),
            and(
              eq(connectionRequest.fromUserId, user.id),
              eq(connectionRequest.toUserId, viewerId),
            ),
          ),
        ),
    );

    const rows = await db
      .select(profileColumns)
      .from(user)
      .leftJoin(profileSong, eq(profileSong.userId, user.id))
      .where(
        and(
          ne(user.id, viewerId),
          isNotNull(user.onboardingCompletedAt),
          notYetDecided,
          afterCursor,
        ),
      )
      .orderBy(desc(user.createdAt), desc(user.id))
      // One extra row tells us whether another page exists without a count query.
      .limit(limit + 1);

    const page = rows.slice(0, limit);
    const lastOfPage = page.at(-1);
    const nextCursor = rows.length > limit && lastOfPage ? lastOfPage.id : null;

    return res.status(200).json({
      status: "success",
      message: "Feed fetched successfully",
      data: {
        items: page.map((row) => ({
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
        })),
        nextCursor,
      },
    });
  } catch (error) {
    console.error("Feed error:", error);
    return res.status(500).json({
      status: "error",
      message: "Could not load the discovery feed. Please try again.",
    });
  }
});

export default feedRouter;
