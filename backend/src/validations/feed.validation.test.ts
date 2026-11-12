import { describe, expect, it } from "vitest";
import { FEED_PAGE_SIZE, MAX_FEED_PAGE_SIZE, feedQuerySchema } from "./feed.validation.js";

describe("feedQuerySchema", () => {
  it("defaults the page size when no limit is sent", () => {
    const parsed = feedQuerySchema.parse({});
    expect(parsed.limit).toBe(FEED_PAGE_SIZE);
    expect(parsed.cursor).toBeUndefined();
  });

  it("accepts a cursor and casts a numeric string limit", () => {
    const parsed = feedQuerySchema.parse({ cursor: "user_123", limit: "5" });
    expect(parsed).toEqual({ cursor: "user_123", limit: 5 });
  });

  it("rejects a blank cursor", () => {
    expect(feedQuerySchema.safeParse({ cursor: "   " }).success).toBe(false);
  });

  it("rejects a non-numeric limit", () => {
    expect(feedQuerySchema.safeParse({ limit: "ten" }).success).toBe(false);
  });

  it("rejects a fractional limit", () => {
    expect(feedQuerySchema.safeParse({ limit: "2.5" }).success).toBe(false);
  });

  it("rejects zero and anything above the cap", () => {
    expect(feedQuerySchema.safeParse({ limit: "0" }).success).toBe(false);
    expect(feedQuerySchema.safeParse({ limit: String(MAX_FEED_PAGE_SIZE + 1) }).success).toBe(false);
  });

  it("accepts the cap itself and ignores unrelated query keys", () => {
    expect(feedQuerySchema.safeParse({ limit: String(MAX_FEED_PAGE_SIZE), noise: "x" }).success).toBe(
      true,
    );
  });
});
