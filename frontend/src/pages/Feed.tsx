import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { RotateCcw } from "lucide-react";
import { authClient } from "../lib/auth-client";
import { fetchFeed, sendSwipe, type FeedUser, type SwipeStatus } from "../lib/api";
import SwipeCard from "../components/feed/SwipeCard";

/* Fetch the next page once the stack gets this low */
const PREFETCH_AT = 3;

/* Pill ghost button shared with the landing page's button language */
const ghostButton =
  "rounded-full border border-white/25 px-6 py-2 text-sm font-medium text-white/90 transition-[background-color,border-color] duration-200 hover:border-white/40 hover:bg-white/10";

export default function Feed() {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  const [users, setUsers] = useState<FeedUser[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exitStatus, setExitStatus] = useState<SwipeStatus | null>(null);

  /* Refs so effects can trigger the next page without re-fetch storms */
  const pageRef = useRef(0);
  const fetchingRef = useRef(false);

  const loadNextPage = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const { users: nextUsers, hasMore: nextHasMore } = await fetchFeed(
        pageRef.current + 1,
      );
      pageRef.current += 1;
      setUsers((prev) => [...prev, ...nextUsers]);
      setHasMore(nextHasMore);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") {
        window.location.href = "/";
        return;
      }
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading the feed.",
      );
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && pageRef.current === 0) void loadNextPage();
  }, [user, loadNextPage]);

  /* Prefetch before the stack visually runs dry. `!error` keeps a failed
     load from re-firing this effect in a loop — Retry is the way back. */
  useEffect(() => {
    if (user && !loading && !error && hasMore && users.length <= PREFETCH_AT) {
      void loadNextPage();
    }
  }, [user, users.length, hasMore, loading, error, loadNextPage]);

  const handleExited = (status: SwipeStatus) => {
    const swipedUser = users[0];
    setUsers((prev) => prev.slice(1));
    if (!swipedUser) return;
    void sendSwipe(status, swipedUser.id).catch((err: unknown) => {
      setError(
        err instanceof Error
          ? err.message
          : "Your swipe could not be saved. Please try again later.",
      );
    });
  };

  const retry = () => {
    pageRef.current = 0;
    setUsers([]);
    setHasMore(true);
    void loadNextPage();
  };

  const signOut = async () => {
    await authClient.signOut();
    window.location.href = "/";
  };

  if (isPending) {
    return (
      <main className="min-h-[calc(100vh-4rem)] px-6 py-16 sm:px-10">
        <p className="mt-4 text-sm text-white/50">Checking your session…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-[calc(100vh-4rem)] px-6 py-16 sm:px-10">
        <p className="mt-4 text-sm text-white/70">
          You&apos;re not signed in.{" "}
          <a href="/" className="underline hover:text-white">
            Go back and join with Google
          </a>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] px-6 py-10 sm:px-10">
      <div className="mx-auto flex max-w-sm items-center justify-between">
        <h2 className="font-heading text-3xl font-semibold text-white/80">
          Discover
        </h2>
        <button onClick={signOut} className={ghostButton}>
          Sign out
        </button>
      </div>

      {error && (
        <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-rose-400/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          {error}
          <button
            onClick={retry}
            className="ml-3 inline-flex items-center gap-1 underline hover:text-white"
          >
            <RotateCcw size={14} /> Retry
          </button>
        </div>
      )}

      {loading && users.length === 0 && (
        <div className="relative mx-auto mt-8 h-[550px] max-w-sm">
          <div className="absolute inset-x-0 h-full animate-pulse rounded-2xl border border-white/[0.08] bg-[#110e17]/80" />
        </div>
      )}

      {!loading && users.length === 0 && !error && (
        <div className="mx-auto mt-16 max-w-sm text-center">
          <p className="font-heading text-2xl font-semibold text-white/80">
            You&apos;re all caught up
          </p>
          <p className="mt-2 text-sm text-white/50">
            No new people to discover right now. Check back soon — your next
            connection might join any minute.
          </p>
        </div>
      )}

      {users.length > 0 && (
        <div className="relative mx-auto mt-8 h-[550px] max-w-sm">
          {/* Cards behind the top one, stacked with a subtle depth offset */}
          {users
            .slice(1, 3)
            .map((cardUser, i) => (
              <SwipeCard
                key={cardUser.id}
                user={cardUser}
                index={i + 1}
                exitStatus={null}
                onExited={() => {}}
                setExitStatus={() => {}}
              />
            ))}
          <AnimatePresence>
            {users[0] && (
              <motion.div
                key={users[0].id}
                exit={{ opacity: 0 }}
                className="absolute inset-x-0"
              >
                <SwipeCard
                  user={users[0]}
                  index={0}
                  exitStatus={exitStatus}
                  onExited={handleExited}
                  setExitStatus={setExitStatus}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-white/40">
        Drag a card right if you&apos;re interested, left to ignore.
      </p>
    </main>
  );
}
