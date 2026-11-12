import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";

/**
 * Keeps public routes (like the landing page) for signed-out visitors.
 * A signed-in user is sent to /discover, which itself forwards to
 * /onboarding while their profile is still incomplete.
 */
export default function RequireGuest({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  if (isPending) {
    return <p className="px-6 py-16 text-sm text-white/50">Checking your session…</p>;
  }
  if (session?.user) return <Navigate to="/discover" replace />;
  return <>{children}</>;
}
