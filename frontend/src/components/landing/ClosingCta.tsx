import { useState } from "react";
import { Link } from "react-router-dom";
import { authClient, signInWithGoogle } from "../../lib/auth-client";
import { useProfile } from "../../lib/profile-context";

/**
 * Auth-aware closing call-to-action at the bottom of the landing page.
 */
export default function ClosingCta() {
  const { data: session } = authClient.useSession();
  const { profile } = useProfile();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setError(null);
    setSigningIn(true);
    const signInError = await signInWithGoogle();
    if (signInError) {
      setSigningIn(false);
      setError(signInError);
    }
  }

  const nextPath = profile?.onboardingCompletedAt ? "/discover" : "/onboarding";
  const nextLabel = profile?.onboardingCompletedAt
    ? "Open Discover"
    : "Finish your profile";

  return (
    <section className="relative overflow-hidden border-t border-white/10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-72 max-w-2xl"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 65% 75% at 50% 35%, rgba(109, 28, 94, 0.35), transparent 72%)",
        }}
      />

      <div className="relative mx-auto max-w-2xl px-6 py-24 text-center sm:py-32">
        <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-vybe-gold">
          Join Vybe
        </p>
        <h2 className="font-heading mt-3 text-3xl font-semibold leading-tight text-white/90 sm:text-4xl">
          Ready to meet people on your wavelength?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/60 sm:text-base">
          Sign in with Google and build your profile around the music you keep
          coming back to.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          {session?.user ? (
            <Link
              to={nextPath}
              className="rounded-full border border-white/25 px-7 py-3 text-sm font-medium text-white/90 transition-[background-color,border-color] duration-200 hover:border-white/40 hover:bg-white/10"
            >
              {nextLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => void handleJoin()}
              disabled={signingIn}
              className="cursor-pointer rounded-full border border-white/25 px-7 py-3 text-sm font-medium text-white/90 transition-[background-color,border-color] duration-200 hover:border-white/40 hover:bg-white/10 disabled:cursor-wait disabled:opacity-60"
            >
              {signingIn ? "Redirecting..." : "Join with Google"}
            </button>
          )}

          {error ? <p className="text-xs text-red-400">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}
