import { useEffect, useRef } from "react";
import {
  motion,
  useAnimationControls,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "motion/react";
import type { FeedUser, SwipeStatus } from "../../lib/api";

/* Horizontal px (or px/s flick) past which a drag commits the swipe */
const COMMIT_DISTANCE = 120;
const COMMIT_VELOCITY = 800;
/* Where the card flies to when leaving the stack */
const EXIT_X = 600;

type SwipeCardProps = {
  user: FeedUser;
  /** 0 for the top card — deeper cards are scaled back and inert */
  index: number;
  /** Set by the parent to trigger the same fly-away a drag would */
  exitStatus: SwipeStatus | null;
  onExited: (status: SwipeStatus) => void;
  setExitStatus: (status: SwipeStatus | null) => void;
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export default function SwipeCard({
  user,
  index,
  exitStatus,
  onExited,
  setExitStatus,
}: SwipeCardProps) {
  const x = useMotionValue(0);
  const controls = useAnimationControls();
  const exitingRef = useRef(false);

  const rotate = useTransform(x, [-300, 300], [-14, 14]);
  const interestedOpacity = useTransform(
    x,
    [-COMMIT_DISTANCE, -20, 20, COMMIT_DISTANCE],
    [0, 0, 0.15, 1],
  );
  const ignoredOpacity = useTransform(
    x,
    [-COMMIT_DISTANCE, -20, 20, COMMIT_DISTANCE],
    [1, 0.15, 0, 0],
  );

  const flyAway = (status: SwipeStatus) => {
    const direction = status === "interested" ? 1 : -1;
    controls
      .start({
        x: direction * EXIT_X,
        rotate: direction * 18,
        opacity: 0,
        transition: { duration: 0.3, ease: "easeOut" },
      })
      .then(() => {
        onExited(status);
        setExitStatus(null);
      });
  };

  useEffect(() => {
    if (!exitStatus || exitingRef.current) return;
    exitingRef.current = true;
    flyAway(exitStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- flyAway is stable via controls
  }, [exitStatus]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (exitingRef.current) return;

    const { offset, velocity } = info;
    let swiped: SwipeStatus | null = null;
    if (offset.x > COMMIT_DISTANCE || velocity.x > COMMIT_VELOCITY) {
      swiped = "interested";
    } else if (offset.x < -COMMIT_DISTANCE || velocity.x < -COMMIT_VELOCITY) {
      swiped = "ignored";
    }

    if (swiped) {
      exitingRef.current = true;
      flyAway(swiped);
    } else {
      controls.start({
        x: 0,
        rotate: 0,
        transition: { type: "spring", stiffness: 350, damping: 28 },
      });
    }
  };

  if (index > 0) {
    return (
      <div
        aria-hidden
        className="absolute inset-x-0 mx-auto h-[520px] max-w-sm rounded-3xl border border-white/10 bg-vybe-850/60"
        style={{
          transform: `translateY(${index * -12}px) scale(${1 - index * 0.04})`,
        }}
      />
    );
  }

  return (
    <motion.div
      drag="x"
      dragListener={!exitingRef.current}
      style={{ x, rotate }}
      animate={controls}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: "grabbing" }}
      className="absolute inset-x-0 mx-auto max-w-sm cursor-grab touch-pan-y select-none overflow-hidden rounded-3xl border border-white/10 bg-vybe-850/80 shadow-2xl shadow-black/50 backdrop-blur-md"
    >
      {/* Direction stamps, revealed by drag progress */}
      <motion.span
        style={{ opacity: interestedOpacity }}
        className="pointer-events-none absolute top-5 left-5 z-10 rotate-[-12deg] rounded-lg border-2 border-emerald-400/60 px-3 py-1 font-heading text-lg font-bold tracking-widest text-emerald-300"
      >
        INTERESTED
      </motion.span>
      <motion.span
        style={{ opacity: ignoredOpacity }}
        className="pointer-events-none absolute top-5 right-5 z-10 rotate-[12deg] rounded-lg border-2 border-rose-400/60 px-3 py-1 font-heading text-lg font-bold tracking-widest text-rose-300"
      >
        IGNORED
      </motion.span>

      {user.image ? (
        <img
          src={user.image}
          alt={`${user.name}'s profile`}
          draggable={false}
          className="h-64 w-full object-cover"
        />
      ) : (
        <div className="flex h-64 w-full items-center justify-center bg-vybe-800/80">
          <span className="font-heading text-5xl font-semibold text-vybe-300">
            {initials(user.name)}
          </span>
        </div>
      )}

      <div className="space-y-3 p-5">
        <div className="flex items-center gap-3">
          <h3 className="font-heading text-2xl font-semibold text-white/90">
            {user.name}
            {user.lastName ? ` ${user.lastName}` : ""}
          </h3>
          {user.age !== null && (
            <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-sm text-white/70">
              {user.age}
            </span>
          )}
          {user.gender && (
            <span className="rounded-full border border-vybe-accent/40 px-2.5 py-0.5 text-sm capitalize text-vybe-300">
              {user.gender}
            </span>
          )}
        </div>

        {user.about && (
          <p className="line-clamp-3 text-sm leading-relaxed text-white/70">
            {user.about}
          </p>
        )}

        {user.favSingers.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {user.favSingers.slice(0, 8).map((singer) => (
              <span
                key={singer}
                className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/80"
              >
                {singer}
              </span>
            ))}
            {user.favSingers.length > 8 && (
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/50">
                +{user.favSingers.length - 8} more
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
