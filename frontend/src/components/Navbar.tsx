import { AudioLines } from "lucide-react";
import { authClient } from "../lib/auth-client";

export default function Navbar() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const joinWithGoogle = (e: React.MouseEvent) => {
    e.preventDefault();
    void authClient.signIn.social({
      provider: "google",
      callbackURL: "http://localhost:5174/feed",
    });
  };

  return (
    <nav className="relative z-20 flex h-16 items-center justify-between border-b border-white/10 px-6 sm:px-10">
      <a href="/" className="group flex select-none items-center gap-2">
        <AudioLines
          className="h-7 w-7 text-vybe-gold transition-transform duration-300 group-hover:scale-110"
          strokeWidth={2.5}
        />
        <span className="text-xl font-medium tracking-[0.2em] text-white/80">
          VYBE
        </span>
      </a>

      {user ? (
        <a
          href="/feed"
          className="rounded-full border border-white/25 px-6 py-2 text-sm font-medium text-white/90 transition-[background-color,border-color] duration-200 hover:border-white/40 hover:bg-white/10"
        >
          {user.name}
        </a>
      ) : (
        <a
          href="#join"
          onClick={joinWithGoogle}
          className="rounded-full border border-white/25 px-6 py-2 text-sm font-medium text-white/90 transition-[background-color,border-color] duration-200 hover:border-white/40 hover:bg-white/10"
        >
          Join Now
        </a>
      )}
    </nav>
  );
}
