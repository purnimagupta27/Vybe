import { createAuthClient } from "better-auth/react";

/* Official better-auth React client pointed at the Express backend,
   where /api/auth is mounted. Cookies are port-scoped off on localhost,
   so the session works across 5174 -> 4000.

   Override the API origin with VITE_API_URL when deploying. */
const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export const authClient = createAuthClient({
  baseURL,
});

/**
 * Starts Google OAuth sign-in via Better Auth and redirects to `/onboarding`.
 * Returns an error message only when starting the flow fails.
 */
export async function signInWithGoogle(): Promise<string | null> {
  const { error } = await authClient.signIn.social({
    provider: "google",
    /* Absolute URL derived from wherever the app is running (5173 or
       5174), so it matches Better Auth's trustedOrigins. */
    callbackURL: `${window.location.origin}/onboarding`,
  });

  if (error) {
    return error.message ?? "Could not start Google sign-in. Please try again.";
  }

  return null;
}
