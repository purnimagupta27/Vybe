import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { buildAudiusStreamUrl, searchAudiusTracks } from "../lib/audius.js";

const musicRouter: Router = Router();

const searchQuerySchema = z.object({
  q: z.string().trim().min(2, "Search needs at least 2 characters").max(100),
});

musicRouter.get("/search", async (req: Request, res: Response) => {
  const parsed = searchQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid search query.",
    });
  }

  try {
    const tracks = await searchAudiusTracks(parsed.data.q);
    return res.status(200).json({
      status: "success",
      data: tracks.map((track) => ({
        ...track,
        streamUrl: buildAudiusStreamUrl(track.id),
      })),
    });
  } catch (error) {
    console.error("Audius search error:", error);
    return res.status(502).json({
      status: "error",
      message: "Music search is unavailable right now. Please try again.",
    });
  }
});

export default musicRouter;
