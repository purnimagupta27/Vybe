import { useEffect, useRef } from "react";
import {
  motion,
  useAnimationControls,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "motion/react";
import type { FeedUser, SwipeStatus } from "../../lib/api";
import { MapPin } from "lucide-react";

/* Horizontal px (or px/s flick) past which a drag commits the swipe */
const COMMIT_DISTANCE = 110;
const COMMIT_VELOCITY = 700;
/* Where the card flies to when leaving the stack */
const EXIT_X = 550;

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

  const rotate = useTransform(x, [-300, 300], [-10, 10]);
  const interestedOpacity = useTransform(x, [15, COMMIT_DISTANCE], [0, 1]);
  const ignoredOpacity = useTransform(x, [-COMMIT_DISTANCE, -15], [1, 0]);

  const flyAway = (status: SwipeStatus) => {
    const direction = status === "interested" ? 1 : -1;
    controls
      .start({
        x: direction * EXIT_X,
        rotate: direction * 14,
        opacity: 0,
        transition: { duration: 0.28, ease: "easeOut" },
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
        className="absolute inset-x-0 mx-auto h-[530px] max-w-sm rounded-2xl border border-white/[0.06] bg-[#110e17]/90 shadow-xl"
        style={{
          transform: `translateY(${index * -10}px) scale(${1 - index * 0.04})`,
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
      className="absolute inset-x-0 mx-auto flex h-[530px] max-w-sm cursor-grab touch-pan-y select-none flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-[#110e17] shadow-2xl shadow-black/70"
    >
      {/* Simple, understated swipe indicator badges */}
      <motion.div
        style={{ opacity: interestedOpacity }}
        className="pointer-events-none absolute top-4 right-4 z-20 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-semibold tracking-wider text-emerald-300 backdrop-blur-md"
      >
        LIKE
      </motion.div>
      <motion.div
        style={{ opacity: ignoredOpacity }}
        className="pointer-events-none absolute top-4 left-4 z-20 rounded-full border border-rose-500/40 bg-rose-500/15 px-3 py-1 text-xs font-semibold tracking-wider text-rose-300 backdrop-blur-md"
      >
        PASS
      </motion.div>

      {/* Top Media / Photo Section */}
      <div className="relative h-[290px] w-full shrink-0 overflow-hidden bg-white/[0.02]">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name}
            draggable={false}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-white/[0.04] to-transparent">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
              <span className="font-heading text-2xl font-bold text-white/50">
                {initials(user.name)}
              </span>
            </div>
          </div>
        )}
        {/* Soft bottom gradient fade into card body */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#110e17] to-transparent" />
      </div>

      {/* Card Content Section */}
      <div className="flex flex-1 flex-col justify-between p-5 pt-1">
        <div className="space-y-2">
          {/* Name, Age & Gender */}
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="font-heading text-2xl font-bold text-white">
                {user.name}
                {user.lastName ? ` ${user.lastName}` : ""}
              </h3>
              {user.age !== null && (
                <span className="text-xl text-white/50">{user.age}</span>
              )}
            </div>
            {(user.city || user.gender) && (
              <p className="mt-0.5 flex items-center gap-1.5 text-xs capitalize text-white/40">
                {user.city && (
                  <span className="flex min-w-0 items-center gap-1">
                    <MapPin size={12} className="shrink-0 text-vybe-gold" />
                    <span className="truncate">{user.city}</span>
                  </span>
                )}
                {user.city && user.gender && <span aria-hidden>·</span>}
                {user.gender && <span>{user.gender}</span>}
              </p>
            )}
          </div>

          {/* Bio / About */}
          {user.about && (
            <p className="line-clamp-2 text-sm leading-relaxed text-white/70">
              {user.about}
            </p>
          )}
        </div>

        {/* Favorite Artists */}
        {user.favSingers.length > 0 && (
          <div className="pt-2">
            <span className="block text-[10px] font-mono tracking-wider text-white/40 uppercase">
              Top Artists
            </span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {user.favSingers.slice(0, 6).map((singer) => (
                <span
                  key={singer}
                  className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs text-white/80"
                >
                  {singer}
                </span>
              ))}
              {user.favSingers.length > 6 && (
                <span className="rounded-md border border-white/[0.05] bg-white/[0.02] px-2 py-1 text-xs text-white/40">
                  +{user.favSingers.length - 6}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
