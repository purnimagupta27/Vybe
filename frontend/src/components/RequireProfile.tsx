import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useProfile } from "../lib/profile-context";

export default function RequireProfile({ children }: { children: ReactNode }) {
  const { profile, loading } = useProfile();
  if (loading) {
    return <p className="px-6 py-16 text-sm text-white/50">Loading your profile…</p>;
  }
  if (!profile?.onboardingCompletedAt) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}
