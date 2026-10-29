import express from 'express'
import 'dotenv/config'
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js"
import profileRouter from "./routes/profile.routes.js"
import requestRouter from './routes/request.routes.js';
import { requireAuth } from './middleware/auth.middleware.js';


const app = express()
const PORT = process.env.PORT ?? 4000

app.all("/api/auth/*splat", toNodeHandler(auth))

app.use(express.json())
app.use("/api/profile", requireAuth, profileRouter)
app.use("/api/request", requireAuth, requestRouter)



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