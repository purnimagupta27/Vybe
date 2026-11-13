import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Loader2, User, Users, X } from "lucide-react";
import {
  getReceivedRequests,
  reviewConnectionRequest,
  type ReceivedConnectionRequest,
  type ReviewDecision,
} from "../lib/api";

const ghostButtonClass =
  "cursor-pointer rounded-full border border-white/25 px-6 py-2.5 text-sm font-medium text-white/90 transition-[background-color,border-color,opacity] duration-200 hover:border-white/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/25 disabled:hover:bg-transparent";

const rejectButtonClass =
  "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/20 text-white/80 transition-[background-color,border-color,color,opacity] duration-200 hover:border-rose-300/50 hover:bg-rose-500/10 hover:text-white disabled:cursor-wait disabled:opacity-40";

const acceptButtonClass =
  "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-vybe-accent text-white transition-opacity duration-200 hover:opacity-90 disabled:cursor-wait disabled:opacity-40";

function displayName(request: ReceivedConnectionRequest) {
  return [request.sender.name, request.sender.lastName].filter(Boolean).join(" ");
}

export default function Connections() {
  const [requests, setRequests] = useState<ReceivedConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(
    null,
  );
  const [busy, setBusy] = useState<{ senderId: string; decision: ReviewDecision } | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getReceivedRequests(controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        // Newest first; the endpoint does not promise an order.
        setRequests([...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error ? err.message : "Could not load your connection requests.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [reloadToken]);

  async function review(request: ReceivedConnectionRequest, decision: ReviewDecision) {
    if (busy) return;

    setBusy({ senderId: request.sender.id, decision });
    setNotice(null);
    try {
      await reviewConnectionRequest(request.sender.id, decision);
      setRequests((current) =>
        current.filter((item) => item.requestId !== request.requestId),
      );
      setNotice({
        tone: "success",
        message:
          decision === "accepted"
            ? `You accepted ${request.sender.name}'s request.`
            : `You rejected ${request.sender.name}'s request.`,
      });
    } catch (err) {
      setNotice({
        tone: "error",
        message:
          err instanceof Error
            ? err.message
            : "Could not review that request. Please try again.",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-2xl px-6 py-8">
      <header className="mb-8">
        {/* <Link
          to="/profile"
          className="group inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/70 transition-all hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to profile</span>
        </Link> */}
        <div className="mt-6 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-white/90 sm:text-3xl">
              Connections
            </h1>
            <p className="mt-1 text-xs text-white/50">
              People who showed interest in you
            </p>
          </div>
          {!loading && !error && requests.length > 0 && (
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-white/60">
              {requests.length} pending
            </span>
          )}
        </div>
      </header>

      {notice && (
        <div
          className={`mb-4 flex items-start gap-3 rounded-xl border px-4 py-2.5 text-xs ${
            notice.tone === "success"
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
              : "border-rose-400/30 bg-rose-500/10 text-rose-100"
          }`}
        >
          <p className="flex-1">{notice.message}</p>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="cursor-pointer underline opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-16 text-sm text-white/50">
          <div className="size-6 animate-spin rounded-full border-2 border-white/20 border-t-vybe-gold" />
          <p>Loading your requests…</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-sm text-white/70">{error}</p>
          <button
            type="button"
            onClick={() => setReloadToken((token) => token + 1)}
            className={ghostButtonClass}
          >
            Try again
          </button>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-34 text-center">
          <div className="flex size-14 items-center justify-center rounded-full border border-white/15 bg-white/5">
            <Users aria-hidden className="size-6 text-white/40" />
          </div>
          <div>
            <p className="font-heading text-lg text-white/85">No pending requests</p>
            <p className="mt-1 text-xs text-white/45">
              When someone shows interest in you, they&rsquo;ll appear here.
            </p>
          </div>
        </div>
      ) : (
        <ul className="space-y-4">
          {requests.map((request) => {
            const sender = request.sender;
            const isBusyForMe = busy?.senderId === sender.id;

            return (
              <li
                key={request.requestId}
                className="group relative overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04] transition-colors hover:border-white/25 hover:bg-white/[0.06]"
              >
                {/* The whole card is the link. It sits under the content, and the
                    content is pointer-transparent, so a click anywhere opens the
                    profile — except on the action buttons, which opt back in. */}
                <Link
                  to={`/profile/${encodeURIComponent(sender.id)}`}
                  aria-label={`View ${displayName(request)}'s profile`}
                  className="absolute inset-0 z-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-vybe-gold/60"
                />

                <div className="pointer-events-none relative z-10 flex items-center gap-4 p-4 sm:p-5">
                  <div className="size-16 shrink-0 overflow-hidden rounded-full bg-white/5 ring-1 ring-transparent transition-[box-shadow] group-hover:ring-white/25">
                    {sender.image ? (
                      <img
                        src={sender.image}
                        alt={displayName(request)}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-white/35">
                        <User aria-hidden className="size-7" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-lg leading-tight text-white/95 transition-colors group-hover:text-white">
                      {displayName(request)}
                      {sender.age ? (
                        <span className="ml-1.5 font-normal text-white/50">{sender.age}</span>
                      ) : null}
                    </p>
                    {sender.gender && (
                      <p className="mt-0.5 text-xs capitalize text-white/45">{sender.gender}</p>
                    )}
                  </div>

                  <div className="pointer-events-auto flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void review(request, "rejected")}
                      disabled={busy !== null}
                      aria-label={`Reject ${displayName(request)}`}
                      title="Reject"
                      className={rejectButtonClass}
                    >
                      {isBusyForMe && busy?.decision === "rejected" ? (
                        <Loader2 aria-hidden className="size-4 animate-spin" />
                      ) : (
                        <X aria-hidden className="size-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => void review(request, "accepted")}
                      disabled={busy !== null}
                      aria-label={`Accept ${displayName(request)}`}
                      title="Accept"
                      className={acceptButtonClass}
                    >
                      {isBusyForMe && busy?.decision === "accepted" ? (
                        <Loader2 aria-hidden className="size-4 animate-spin" />
                      ) : (
                        <Check aria-hidden className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
