import { createAuthClient } from "better-auth/react";

/* Official better-auth React client pointed at the Express backend,
   where /api/auth is mounted. Cookies are port-scoped off on localhost,
   so the session works across 5174 -> 4000.

   Override the API origin with VITE_API_URL when deploying. */
const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export const authClient = createAuthClient({
  baseURL,
});
