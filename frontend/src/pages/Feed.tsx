import { authClient } from "../lib/auth-client";

/* Simple post-sign-in page (callbackURL target of the Google OAuth flow).
   Deliberately minimal for now — h2 "Feed" — grows into the real feed. */
export default function Feed() {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  const signOut = async () => {
    await authClient.signOut();
    window.location.href = "/";
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] px-6 py-16 sm:px-10">
      <h2 className="font-heading text-3xl font-semibold text-white/80">Feed</h2>
      {isPending && (
        <p className="mt-4 text-sm text-white/50">Checking your session…</p>
      )}
      {!isPending && !user && (
        <p className="mt-4 text-sm text-white/70">
          You&apos;re not signed in.{" "}
          <a href="/" className="underline hover:text-white">
            Go back and join with Google
          </a>
          .
        </p>
      )}
      {user && (
        <p className="mt-4 text-sm text-white/70">Signed in as {user.name}</p>
      )}
      {user && (
        <button
          onClick={signOut}
          className="mt-6 rounded-full border border-white/25 px-5 py-2 text-sm font-medium text-white/90 transition-[background-color,border-color] duration-200 hover:border-white/40 hover:bg-white/10"
        >
          Sign out
        </button>
      )}
    </main>
  );
}
