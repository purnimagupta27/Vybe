import { z } from "zod";

// How many cards the feed hands back when the client does not ask for a size.
export const FEED_PAGE_SIZE = 10;
// Upper bound so one request can never pull the whole user table.
export const MAX_FEED_PAGE_SIZE = 20;

// Query contract for GET /api/feed.
// `cursor` is the id of the last profile the client already saw; it is opaque
// to the client and resolved to a row server-side.
export const feedQuerySchema = z.object({
  cursor: z
    .string()
    .trim()
    .min(1, "cursor cannot be empty")
    .max(200, "cursor is too long")
    .optional(),
  limit: z.coerce
    .number({ error: "limit must be a number" })
    .int("limit must be a whole number")
    .min(1, "limit must be at least 1")
    .max(MAX_FEED_PAGE_SIZE, `limit cannot exceed ${MAX_FEED_PAGE_SIZE}`)
    .default(FEED_PAGE_SIZE),
});

export type FeedQuery = z.infer<typeof feedQuerySchema>;
