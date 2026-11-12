import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useProfile } from "../lib/profile-context";

export default function RequireProfile({ children }: { children: ReactNode }) {
  const { profile, loading, error, refresh } = useProfile();
  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 text-sm text-white/50">
        <div className="size-6 animate-spin rounded-full border-2 border-white/20 border-t-vybe-gold mb-3" />
        <p>Loading…</p>
      </main>
    );
  }
  if (!profile && error) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-white/70">{error}</p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-4 cursor-pointer rounded-full border border-white/25 px-6 py-2 text-sm font-medium text-white/90 transition-[background-color,border-color] duration-200 hover:border-white/40 hover:bg-white/10"
        >
          Try again
        </button>
      </main>
    );
  }
  if (!profile?.onboardingCompletedAt) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}
