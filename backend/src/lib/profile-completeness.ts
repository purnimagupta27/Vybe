export function isProfileComplete(profile: { onboardingCompletedAt: Date | null }): boolean {
  return profile.onboardingCompletedAt !== null;
}
