import { useState } from "react";
import { AudioLines } from "lucide-react";
import { authClient } from "../lib/auth-client";

export default function Navbar() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinWithGoogle = async () => {
    setError(null);
    setSigningIn(true);

    const { error: signInError } = await authClient.signIn.social({
      provider: "google",
      /* Absolute URL derived from wherever the app is running (5173 or
         5174), so it matches Better Auth's trustedOrigins. */
      callbackURL: `${window.location.origin}/onboarding`,
    });

    /* On success the client redirects to Google, so we only get here when
       something failed. */
    if (signInError) {
      setSigningIn(false);
      setError(
        signInError.message ??
          "Could not start Google sign-in. Please try again.",
      );
    }
  };

  return (
    <nav className="relative z-20 flex h-16 translate-y-2 items-center justify-between px-6 sm:px-10">
      <a href="/" className="group ml-2 flex select-none items-center gap-2 sm:ml-4">
        <AudioLines
          className="h-7 w-7 text-vybe-gold transition-transform duration-300 group-hover:scale-110"
          strokeWidth={2.5}
        />
        <span className="text-xl font-bold tracking-[0.2em] text-white/80">
          VYBE
        </span>
      </a>

      <div className="mr-2 flex flex-col items-end gap-1 sm:mr-8">
        {user ? (
          <a href="/discover" className="rounded-full border border-white/25 px-6 py-2 text-sm font-medium text-white/90 transition-[background-color,border-color] duration-200 hover:border-white/40 hover:bg-white/10">
            {user.name}
          </a>
        ) : (
          <button
            type="button"
            onClick={joinWithGoogle}
            disabled={signingIn}
            className=" cursor-pointer rounded-full border border-white/25 px-6 py-2 text-sm font-medium text-white/90 transition-[background-color,border-color] duration-200 hover:border-white/40 hover:bg-white/10 disabled:cursor-wait disabled:opacity-60"
          >
            {signingIn ? "Redirecting..." : "Join now"}
          </button>
        )}
        {error && (
          <p className="max-w-[240px] text-right text-xs text-red-400">
            {error}
          </p>
        )}
      </div>
    </nav>
  );
}
