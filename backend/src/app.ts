import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js"
import { trustedOrigins } from "./lib/origins.js"
import profileRouter from "./routes/profile.routes.js"
import musicRouter from "./routes/music.routes.js"
import requestRouter from './routes/request.routes.js';
import { requireAuth } from './middleware/auth.middleware.js';
import userRouter from './routes/user.routes.js';


const app = express()
const PORT = process.env.PORT ?? 4000

/* The Vite dev server (5173/5174) is a different origin from the API
   (4000), so the browser needs CORS — including the OPTIONS preflight —
   or it blocks the social sign-in request before it reaches Google.
   Must be registered before the auth handler. */
app.use(cors({
  origin: (origin, callback) => {
    // Requests without an Origin header (curl, server-to-server, same-origin) pass through.
    if (!origin || trustedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));

app.all("/api/auth/*splat", toNodeHandler(auth))

app.use(express.json())
app.use("/api/profile", requireAuth, profileRouter)
app.use("/api/music", requireAuth, musicRouter)
app.use("/api/request", requireAuth, requestRouter)
app.use("/api/user", requireAuth, userRouter)



app.get("/oauth-test", (_req, res) => {
  res.type("html").send(`
    <h2>Google OAuth Test</h2>
    <button onclick="login()">Continue with Google</button>

    <script>
      async function login() {
        const response = await fetch(
          "/api/auth/sign-in/social",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              provider: "google",
              callbackURL: "http://localhost:4000/oauth-test"
            })
          }
        );

        const data = await response.json();

        if (data.url) {
          window.location.href = data.url;
        } else {
          console.error(data);
          alert("Google login start nahi hua. Console check karo.");
        }
      }
    </script>
  `);
});

app.listen(PORT, () => console.log("Server is running"))