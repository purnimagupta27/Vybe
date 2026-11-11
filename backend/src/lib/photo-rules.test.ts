import { describe, expect, it } from "vitest";
import { isAllowedPhoto } from "./photo-rules.js";

describe("isAllowedPhoto", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])("accepts %s", (type) => {
    expect(isAllowedPhoto(type)).toBe(true);
  });

  it.each(["image/gif", "application/pdf", "text/plain"])("rejects %s", (type) => {
    expect(isAllowedPhoto(type)).toBe(false);
  });
});
