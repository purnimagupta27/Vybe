import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, AudioLines, MapPin, Pause, Play, User } from "lucide-react";
import { getPublicProfile, type PublicProfile } from "../lib/api";

/**
 * Someone else's profile, read-only. The owner's version lives at /profile and
 * adds photo upload, editing, and the account menu; nothing here can change data.
 */
export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!userId) {
      setError("That profile could not be found.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getPublicProfile(userId, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setProfile(data);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Could not load that profile.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [userId, reloadToken]);

  // A new person means the previous track must not keep playing.
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [userId]);

  function togglePlay() {
    const streamUrl = profile?.song?.streamUrl;
    if (!streamUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(streamUrl);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 text-sm text-white/50">
        <div className="mb-3 size-6 animate-spin rounded-full border-2 border-white/20 border-t-vybe-gold" />
        <p>Loading profile…</p>
      </main>
    );
  }

  if (!profile || error) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-white/70">{error ?? "That profile could not be found."}</p>
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setReloadToken((token) => token + 1)}
            className="cursor-pointer rounded-full border border-white/25 px-6 py-2 text-sm font-medium text-white/90 transition-colors hover:border-white/40 hover:bg-white/10"
          >
            Try again
          </button>
          <Link
            to="/connections"
            className="rounded-full bg-white/5 px-6 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            Back to connections
          </Link>
        </div>
      </main>
    );
  }

  const displayName = [profile.name, profile.lastName].filter(Boolean).join(" ");

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-3xl px-6 py-8 sm:px-10">
      <Link
        to="/connections"
        className="group inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/70 transition-all hover:bg-white/10 hover:text-white"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        <span>Back to connections</span>
      </Link>

      <div className="mt-10 sm:mt-14">
        <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:gap-7 sm:text-left">
          <div className="size-28 shrink-0 overflow-hidden rounded-full bg-white/5 sm:size-32">
            {profile.image ? (
              <img src={profile.image} alt={displayName} className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center bg-white/5 text-white/35">
                <User className="size-12" aria-hidden />
              </div>
            )}
          </div>

          <div className="mt-5 min-w-0 flex-1 sm:mt-1">
            <h1 className="font-heading text-2xl font-semibold text-white/95 sm:text-3xl">
              {displayName}
              {profile.age ? (
                <span className="ml-2.5 text-xl font-normal text-white/50 sm:text-2xl">
                  {profile.age}
                </span>
              ) : null}
            </h1>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-white/50 sm:justify-start">
              {profile.city ? (
                <span className="inline-flex items-center gap-1 text-white/70">
                  <MapPin className="size-3.5 text-vybe-gold" aria-hidden />
                  {profile.city}
                </span>
              ) : null}
              {profile.gender ? (
                <span className="capitalize text-white/50">{profile.gender}</span>
              ) : null}
            </div>

            {profile.about ? (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-white/75">
                {profile.about}
              </p>
            ) : (
              <p className="mt-4 text-sm italic text-white/40">No bio added yet.</p>
            )}
          </div>
        </div>

        {profile.favSingers.length > 0 && (
          <div className="mt-8 pt-4">
            <h2 className="mb-3 font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-vybe-gold">
              Favorite Artists &amp; Singers
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.favSingers.map((singer) => (
                <span
                  key={singer}
                  className="rounded-full bg-white/5 px-3.5 py-1 text-xs text-white/80"
                >
                  {singer}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.song && (
          <div className="mt-8 pt-4">
            <h2 className="mb-3 font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-vybe-gold">
              Favorite Song
            </h2>

            <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.04] p-4">
              <div className="flex min-w-0 items-center gap-3.5">
                {profile.song.artworkUrl ? (
                  <img
                    src={profile.song.artworkUrl}
                    alt=""
                    className="size-13 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex size-13 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/35">
                    <AudioLines className="size-6" aria-hidden />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white/95">
                    {profile.song.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-white/55">{profile.song.artist}</p>
                </div>
              </div>

              {profile.song.streamUrl && (
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause track" : "Play track"}
                  className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white/90 transition-colors hover:bg-vybe-gold/25 hover:text-white"
                >
                  {isPlaying ? (
                    <Pause className="size-4" aria-hidden />
                  ) : (
                    <Play className="ml-0.5 size-4" aria-hidden />
                  )}
                </button>
              )}
            </div>

            {profile.song.story && (
              <div className="mt-4 rounded-xl bg-white/[0.03] p-4">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-white/40">
                  The story behind it
                </p>
                <p className="text-sm italic leading-relaxed text-white/80">
                  &ldquo;{profile.song.story}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
