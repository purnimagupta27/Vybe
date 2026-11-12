import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildAudiusStreamUrl,
  getAudiusTrack,
  mapAudiusArtist,
  mapAudiusTrack,
} from "./audius.js";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("mapAudiusTrack", () => {
  it("maps an Audius track into the stored shape", () => {
    expect(
      mapAudiusTrack({
        id: "ZlwB7",
        title: "Instrumental chill",
        duration: 180,
        user: { name: "Arly" },
        artwork: { "480x480": "https://img.example/art.jpg" },
      }),
    ).toEqual({
      id: "ZlwB7",
      title: "Instrumental chill",
      artist: "Arly",
      artworkUrl: "https://img.example/art.jpg",
      durationSeconds: 180,
    });
  });

  it("returns null for a malformed payload", () => {
    expect(mapAudiusTrack({ id: 5 })).toBeNull();
  });
});

describe("buildAudiusStreamUrl", () => {
  it("includes the app name and track id", () => {
    vi.stubEnv("AUDIUS_APP_NAME", "Vybe");
    expect(buildAudiusStreamUrl("ZlwB7")).toBe(
      "https://api.audius.co/v1/tracks/ZlwB7/stream?app_name=Vybe",
    );
  });
});

describe("getAudiusTrack", () => {
  it("returns null when Audius responds non-OK", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(getAudiusTrack("ZlwB7")).resolves.toBeNull();
  });
});

describe("mapAudiusArtist", () => {
  it("maps an Audius artist profile correctly", () => {
    expect(
      mapAudiusArtist({
        id: "AxV27",
        name: "Spakinsky",
        handle: "spakinsky",
        is_verified: true,
        profile_picture: { "150x150": "https://img.example/pic.jpg" },
      }),
    ).toEqual({
      id: "AxV27",
      name: "Spakinsky",
      handle: "spakinsky",
      isVerified: true,
      profilePictureUrl: "https://img.example/pic.jpg",
    });
  });

  it("returns null when id or name is missing", () => {
    expect(mapAudiusArtist({ id: "AxV27" })).toBeNull();
    expect(mapAudiusArtist({ name: "" })).toBeNull();
  });
});
