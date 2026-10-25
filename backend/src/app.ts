import express, {type Request, type Response} from 'express'
import 'dotenv/config'
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js"


const app = express()
const PORT = process.env.PORT ?? 4000

app.use(express.json())

app.all("/api/auth/*splat", toNodeHandler(auth))

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

app.get('/', (req: Request, res: Response) => {
    console.log("Hello")
    return res.json({message: "Success"})
})

app.listen(PORT, () => console.log("Server is running"))