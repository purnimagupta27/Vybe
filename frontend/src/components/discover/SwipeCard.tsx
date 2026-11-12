import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { MapPin, Music2, Pause, Play } from "lucide-react";
import type { FeedProfile, SwipeDecision } from "../../lib/api";

/** How far the card must travel before the release counts as a decision. */
const DECIDE_THRESHOLD = 110;
/** Must match the fly-out transition below. */
const EXIT_MS = 240;
const SPRING_BACK = "transform 300ms cubic-bezier(0.23, 1, 0.32, 1)";

export type SwipeCardHandle = {
  /** Runs the same fly-out animation a drag release would, then decides. */
  swipe: (decision: SwipeDecision) => void;
};

type SwipeCardProps = {
  profile: FeedProfile;
  onDecide: (decision: SwipeDecision) => void;
};

/**
 * One photo-first profile card. Dragging past the threshold, pressing an arrow
 * key, or calling the imperative `swipe()` all resolve to the same decision.
 */
const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(function SwipeCard(
  { profile, onDecide },
  ref,
) {
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [exit, setExit] = useState<1 | -1 | null>(null);
  const [playing, setPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const originRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef({ x: 0, y: 0 });
  const decidedRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const decide = useCallback(
    (decision: SwipeDecision) => {
      if (decidedRef.current) return;
      decidedRef.current = true;
      setExit(decision === "interested" ? 1 : -1);
      timerRef.current = window.setTimeout(() => onDecide(decision), EXIT_MS);
    },
    [onDecide],
  );

  useImperativeHandle(ref, () => ({ swipe: decide }), [decide]);

  // Leaving the page mid-swipe must not fire a decision afterwards.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        decide("ignored");
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        decide("interested");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [decide]);

  const updateDrag = (x: number, y: number) => {
    dragRef.current = { x, y };
    setDrag({ x, y });
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (decidedRef.current) return;
    pointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    originRef.current = {
      x: event.clientX - dragRef.current.x,
      y: event.clientY - dragRef.current.y,
    };
    setDragging(true);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    updateDrag(
      event.clientX - originRef.current.x,
      event.clientY - originRef.current.y,
    );
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    pointerIdRef.current = null;
    setDragging(false);

    const { x } = dragRef.current;
    if (Math.abs(x) >= DECIDE_THRESHOLD) {
      decide(x > 0 ? "interested" : "ignored");
      return;
    }
    updateDrag(0, 0);
  };

  // A cancelled gesture (system interruption) is never a decision.
  const onPointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    pointerIdRef.current = null;
    setDragging(false);
    updateDrag(0, 0);
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      const started = audio.play();
      setPlaying(true);
      void started?.catch(() => setPlaying(false));
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  const { song, image, name, age, city, about, favSingers } = profile;
  const offsetX = exit ? exit * (window.innerWidth * 1.25) : drag.x;
  const offsetY = exit ? drag.y : drag.y * 0.15;
  const rotation = exit ? exit * 18 : drag.x / 22;
  const transform = `translate3d(${offsetX}px, ${offsetY}px, 0) rotate(${rotation}deg)`;
  const transition = dragging
    ? "none"
    : exit
      ? `transform ${EXIT_MS}ms cubic-bezier(0.23, 1, 0.32, 1), opacity ${EXIT_MS}ms`
      : SPRING_BACK;
  // Stamps fade in proportionally to how close the card is to the threshold.
  const pull = Math.min(Math.abs(drag.x) / DECIDE_THRESHOLD, 1);
  const singers = favSingers.slice(0, 3);
  const extraSingers = favSingers.length - singers.length;

  return (
    <article className="relative w-full max-w-[390px] sm:max-w-[410px] select-none">
      <div
        role="group"
        aria-label={`${name}${age ? `, ${age}` : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        className="relative aspect-[3/4.2] w-full cursor-grab overflow-hidden rounded-[28px] border border-white/15 bg-vybe-900 shadow-[0_36px_90px_-36px_rgba(0,0,0,0.95)] active:cursor-grabbing"
        style={{
          transform,
          transition,
          opacity: exit ? 0 : 1,
          // Let the page scroll vertically; only horizontal drags belong to the card.
          touchAction: "pan-y",
          willChange: "transform",
        }}
      >
        {image ? (
          <img
            src={image}
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Music2 className="size-16 text-white/15" />
          </div>
        )}

        {/* Scrim carries the text over any photo. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[68%] bg-gradient-to-t from-[#050306] via-[#050306]/85 to-transparent"
        />

        {/* Drag stamps — right pull means interested, left pull means ignore. */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-5 top-6 -rotate-12 rounded-lg border-2 border-vybe-gold px-3 py-1 font-heading text-sm font-bold tracking-[0.18em] text-vybe-gold"
          style={{ opacity: exit === 1 ? 1 : exit === -1 ? 0 : pull * (drag.x > 0 ? 1 : 0) }}
        >
          INTERESTED
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute right-5 top-6 rotate-12 rounded-lg border-2 border-rose-300 px-3 py-1 font-heading text-sm font-bold tracking-[0.18em] text-rose-300"
          style={{ opacity: exit === -1 ? 1 : exit === 1 ? 0 : pull * (drag.x < 0 ? 1 : 0) }}
        >
          IGNORE
        </span>

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 sm:p-6">
          <div>
            <h2 className="font-heading text-2xl sm:text-3xl font-semibold leading-tight text-white">
              {name}
              {age ? `, ${age}` : ""}
            </h2>
            {city && (
              <p className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm text-white/60">
                <MapPin aria-hidden className="size-3.5 shrink-0" />
                {city}
              </p>
            )}
          </div>

          {song && (
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-black/45 p-2.5 backdrop-blur-sm">
              <div className="size-10 shrink-0 overflow-hidden rounded-xl bg-white/10">
                {song.artworkUrl ? (
                  <img
                    src={song.artworkUrl}
                    alt=""
                    draggable={false}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <Music2 aria-hidden className="size-4 text-white/40" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-white/90">{song.title}</p>
                <p className="truncate text-[11px] text-white/50">{song.artist}</p>
              </div>
              <button
                type="button"
                onClick={togglePlay}
                onPointerDown={(event) => event.stopPropagation()}
                aria-label={playing ? "Pause their song" : "Play their song"}
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/20 text-white/90 transition-[background-color,border-color] duration-200 hover:border-white/40 hover:bg-white/10"
              >
                {playing ? (
                  <Pause aria-hidden className="size-4" />
                ) : (
                  <Play aria-hidden className="size-4 translate-x-px" />
                )}
              </button>
            </div>
          )}

          {song?.story && (
            <p className="line-clamp-2 text-xs leading-relaxed text-white/70">
              &ldquo;{song.story}&rdquo;
            </p>
          )}

          {about && (
            <p className="line-clamp-2 text-xs leading-relaxed text-white/60">{about}</p>
          )}

          {singers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {singers.map((singer) => (
                <span
                  key={singer}
                  className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-white/70"
                >
                  {singer}
                </span>
              ))}
              {extraSingers > 0 && (
                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-white/50">
                  +{extraSingers}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {song && (
        <audio
          ref={audioRef}
          src={song.streamUrl}
          preload="none"
          onEnded={() => setPlaying(false)}
        />
      )}

      <span className="sr-only" aria-live="polite">
        {exit === 1 ? "Marked interested" : exit === -1 ? "Ignored" : ""}
      </span>
      <span className="sr-only">
        Swipe left to ignore, right to show interest. You can also use the arrow keys.
      </span>
    </article>
  );
});

export default SwipeCard;
