/* Browser origins allowed to talk to the backend (CORS) and to start
   an OAuth flow (Better Auth trustedOrigins).

   Override with a comma-separated CORS_ORIGINS env var in production,
   e.g. CORS_ORIGINS=https://vybe.app,https://www.vybe.app */
const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
];

const fromEnv = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const trustedOrigins = Array.from(new Set([...DEFAULT_ORIGINS, ...fromEnv]));
