import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useProfile } from "../lib/profile-context";

export default function RequireProfile({ children }: { children: ReactNode }) {
  const { profile, loading, error, refresh } = useProfile();
  if (loading) {
    return <p className="px-6 py-16 text-sm text-white/50">Loading your profile…</p>;
  }
  if (!profile && error) {
    return (
      <div className="px-6 py-16">
        <p className="text-sm text-white/70">{error}</p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-4 cursor-pointer rounded-full border border-white/25 px-6 py-2 text-sm font-medium text-white/90 transition-[background-color,border-color] duration-200 hover:border-white/40 hover:bg-white/10"
        >
          Try again
        </button>
      </div>
    );
  }
  if (!profile?.onboardingCompletedAt) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}
