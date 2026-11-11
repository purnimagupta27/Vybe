import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  if (isPending) {
    return <p className="px-6 py-16 text-sm text-white/50">Checking your session…</p>;
  }
  if (!session?.user) return <Navigate to="/" replace />;
  return <>{children}</>;
}
