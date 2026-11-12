import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  if (isPending) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 text-sm text-white/50">
        <div className="size-6 animate-spin rounded-full border-2 border-white/20 border-t-vybe-gold mb-3" />
        <p>Loading…</p>
      </main>
    );
  }
  if (!session?.user) return <Navigate to="/" replace />;
  return <>{children}</>;
}
