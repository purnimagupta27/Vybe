import { useCallback, useEffect, useRef, useState } from "react";
import { Music2, RefreshCw } from "lucide-react";
import SwipeCard from "../components/discover/SwipeCard";
import {
  getFeed,
  sendConnectionRequest,
  type FeedProfile,
  type SwipeDecision,
} from "../lib/api";

/** Pull the next page while a few cards are still queued. */
const PREFETCH_BELOW = 3;

const pillClass =
  "cursor-pointer rounded-full border border-white/25 px-6 py-2 text-sm font-medium text-white/90 transition-[background-color,border-color] duration-200 hover:border-white/40 hover:bg-white/10";

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-white/50">
      <div className="size-6 animate-spin rounded-full border-2 border-white/20 border-t-vybe-gold" />
      <p className="text-xs">{label}</p>
    </div>
  );
}

export default function Discover() {
  const [cards, setCards] = useState<FeedProfile[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exhausted, setExhausted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const loadingMoreRef = useRef(false);
  const current = cards[0];

  // First page (and every manual refresh).
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setCards([]);
    setCursor(null);
    setExhausted(false);

    getFeed(undefined, controller.signal)
      .then((page) => {
        if (controller.signal.aborted) return;
        setCards(page.items);
        setCursor(page.nextCursor);
        setExhausted(page.nextCursor === null);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Could not load the discovery feed.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [reloadToken]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !cursor || exhausted) return;
    loadingMoreRef.current = true;
    try {
      const page = await getFeed(cursor);
      setCards((prev) => {
        const seen = new Set(prev.map((card) => card.id));
        return [...prev, ...page.items.filter((card) => !seen.has(card.id))];
      });
      setCursor(page.nextCursor);
      setExhausted(page.nextCursor === null);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Couldn't load more profiles.");
    } finally {
      loadingMoreRef.current = false;
    }
  }, [cursor, exhausted]);

  useEffect(() => {
    if (!loading && !error && cards.length > 0 && cards.length <= PREFETCH_BELOW) {
      void loadMore();
    }
  }, [cards.length, loading, error, loadMore]);

  // The card animates itself out, then reports here. Optimistic: the card is
  // gone immediately and only comes back if the request fails.
  const handleDecide = useCallback(
    (decision: SwipeDecision) => {
      const card = cards[0];
      if (!card) return;

      setCards((prev) => prev.slice(1));
      setNotice(null);

      sendConnectionRequest(card.id, decision).catch((err: unknown) => {
        setCards((prev) =>
          prev.some((candidate) => candidate.id === card.id) ? prev : [card, ...prev],
        );
        setNotice(
          err instanceof Error ? err.message : "Couldn't save that. Please try again.",
        );
      });
    },
    [cards],
  );

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-xl flex-col items-center justify-center px-4 py-6 sm:py-10">
      <header className="mb-10 text-center">
        <h1 className="font-heading text-xl sm:text-2xl font-semibold tracking-tight text-white/90">
          Discover
        </h1>
        <p className="mt-1 text-xs text-white/50">
          Swipe right to show interest, left to pass.
        </p>
      </header>

      {notice && (
        <div className="mb-4 flex w-full max-w-[380px] sm:max-w-[400px] items-start gap-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-100">
          <p className="flex-1">{notice}</p>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="cursor-pointer text-rose-200/70 underline hover:text-rose-100"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex w-full max-w-[380px] sm:max-w-[400px] items-center justify-center">
        {loading ? (
          <LoadingState label="Finding people who feel your music…" />
        ) : error ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-white/70">{error}</p>
            <button
              type="button"
              onClick={() => setReloadToken((token) => token + 1)}
              className={pillClass}
            >
              Try again
            </button>
          </div>
        ) : current ? (
          <SwipeCard key={current.id} profile={current} onDecide={handleDecide} />
        ) : exhausted ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-full border border-white/15 bg-white/5">
              <Music2 aria-hidden className="size-6 text-white/40" />
            </div>
            <div>
              <p className="font-heading text-lg text-white/85">You&rsquo;re all caught up</p>
              <p className="mt-1 text-xs text-white/45">No more profiles to show right now.</p>
            </div>
            <button
              type="button"
              onClick={() => setReloadToken((token) => token + 1)}
              className={`${pillClass} inline-flex items-center gap-2`}
            >
              <RefreshCw aria-hidden className="size-4" />
              Refresh
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            {notice ? (
              <button
                type="button"
                onClick={() => {
                  setNotice(null);
                  void loadMore();
                }}
                className={pillClass}
              >
                Try again
              </button>
            ) : (
              <LoadingState label="Loading more profiles…" />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
