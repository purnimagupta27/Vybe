import { describe, expect, it } from "vitest";
import { completeProfileSchema, editProfileSchema } from "./profile.validation.js";

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

describe("editProfileSchema", () => {
  it("accepts a partial edit with a song", () => {
    expect(
      editProfileSchema.safeParse({ city: "Pune", song: valid.song }).success,
    ).toBe(true);
  });

  it("accepts a song-only edit", () => {
    expect(editProfileSchema.safeParse({ song: valid.song }).success).toBe(true);
  });

  it("rejects a song with an empty story", () => {
    expect(
      editProfileSchema.safeParse({ song: { trackId: "ZlwB7", story: "  " } }).success,
    ).toBe(false);
  });

  it("rejects a malformed track id", () => {
    expect(
      editProfileSchema.safeParse({ song: { trackId: "not a track!", story: "Good." } }).success,
    ).toBe(false);
  });

  it("rejects unknown song keys", () => {
    expect(
      editProfileSchema.safeParse({
        song: { trackId: "ZlwB7", story: "Good.", streamUrl: "https://evil.example/x.mp3" },
      }).success,
    ).toBe(false);
  });

  it("rejects email", () => {
    expect(editProfileSchema.safeParse({ email: "new@example.com" }).success).toBe(false);
  });

  it("rejects image", () => {
    expect(editProfileSchema.safeParse({ image: "https://example.com/x.png" }).success).toBe(false);
  });

  it("accepts text at the limits and rejects one character over", () => {
    expect(editProfileSchema.safeParse({ about: "a".repeat(500) }).success).toBe(true);
    expect(editProfileSchema.safeParse({ about: "a".repeat(501) }).success).toBe(false);
    expect(
      editProfileSchema.safeParse({ song: { trackId: "ZlwB7", story: "a".repeat(500) } }).success,
    ).toBe(true);
    expect(
      editProfileSchema.safeParse({ song: { trackId: "ZlwB7", story: "a".repeat(501) } }).success,
    ).toBe(false);
    expect(
      editProfileSchema.safeParse({ favSingers: Array.from({ length: 30 }, (_, i) => `s${i}`) })
        .success,
    ).toBe(true);
    expect(
      editProfileSchema.safeParse({ favSingers: Array.from({ length: 31 }, (_, i) => `s${i}`) })
        .success,
    ).toBe(false);
  });
});
