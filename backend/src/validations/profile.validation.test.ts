import { describe, expect, it } from "vitest";
import { completeProfileSchema } from "./profile.validation.js";

const valid = {
  name: "Purnima",
  lastName: "Gupta",
  gender: "female" as const,
  age: 24,
  city: "Pune",
  about: "I collect vinyl and late-night playlists.",
  favSingers: ["Prateek Kuhad"],
  song: { trackId: "ZlwB7", story: "This song got me through my first solo trip." },
};

describe("completeProfileSchema", () => {
  it("accepts a fully filled profile", () => {
    expect(completeProfileSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an empty city", () => {
    expect(completeProfileSchema.safeParse({ ...valid, city: "  " }).success).toBe(false);
  });

  it("requires at least one favorite singer", () => {
    expect(completeProfileSchema.safeParse({ ...valid, favSingers: [] }).success).toBe(false);
  });

  it("requires a song story", () => {
    expect(
      completeProfileSchema.safeParse({ ...valid, song: { trackId: "ZlwB7", story: "" } }).success,
    ).toBe(false);
  });

  it("rejects an age under 18", () => {
    expect(completeProfileSchema.safeParse({ ...valid, age: 17 }).success).toBe(false);
  });

  it("rejects a name shorter than 4 characters", () => {
    expect(completeProfileSchema.safeParse({ ...valid, name: "Abc" }).success).toBe(false);
  });
});
