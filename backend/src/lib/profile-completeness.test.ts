import { describe, expect, it } from "vitest";
import { isProfileComplete } from "./profile-completeness.js";

describe("isProfileComplete", () => {
  it("is false when onboarding has not been completed", () => {
    expect(isProfileComplete({ onboardingCompletedAt: null })).toBe(false);
  });

  it("is true once the completion timestamp exists", () => {
    expect(isProfileComplete({ onboardingCompletedAt: new Date() })).toBe(true);
  });
});
