import { createAuthClient } from "better-auth/react";

/* Official better-auth React client pointed at the Express backend,
   where /api/auth is mounted. Cookies are port-scoped off on localhost,
   so the session works across 5174 -> 4000. */
export const authClient = createAuthClient({
  baseURL: "http://localhost:4000",
});
