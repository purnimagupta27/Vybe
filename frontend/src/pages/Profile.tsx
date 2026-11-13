import { useState, useRef } from "react";
import type { ChangeEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  AudioLines,
  Camera,
  Loader2,
  MapPin,
  Pause,
  Play,
  User,
} from "lucide-react";
import { uploadProfilePhoto } from "../lib/api";
import { useProfile } from "../lib/profile-context";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export default function Profile() {
  const { profile, loading, error, refresh } = useProfile();
  const [isPlaying, setIsPlaying] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handlePhotoFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setPhotoError("Photo must be JPEG, PNG, or WebP.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("Photo must be under 5 MB.");
      return;
    }

    setPhotoError(null);
    setPhotoUploading(true);
    try {
      await uploadProfilePhoto(file);
      await refresh();
    } catch (err) {
      setPhotoError(
        err instanceof Error ? err.message : "Could not upload the photo. Please try again."
      );
    } finally {
      setPhotoUploading(false);
    }
  }

  const togglePlay = () => {
    if (!profile?.song?.streamUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(profile.song.streamUrl);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 text-sm text-white/50">
        <div className="size-6 animate-spin rounded-full border-2 border-white/20 border-t-vybe-gold mb-3" />
        <p>Loading…</p>
      </main>
    );
  }

  if (!profile && error) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-white/70">{error}</p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-4 cursor-pointer rounded-full border border-white/25 px-6 py-2 text-sm font-medium text-white/90 hover:border-white/40 hover:bg-white/10"
        >
          Try again
        </button>
      </main>
    );
  }

  if (!profile) return null;

  const displayName = [profile.name, profile.lastName].filter(Boolean).join(" ");

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-4xl px-6 sm:px-10 py-8">
      <div className="mb-8 flex w-full items-center justify-between">
        <Link
          to="/discover"
          className="group inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/70 transition-all hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Discover</span>
        </Link>
        <Link
          to="/profile/edit"
          className="cursor-pointer rounded-full bg-white/10 px-5 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/15 hover:text-white"
        >
          Edit details
        </Link>
      </div>

      <div className="mx-auto max-w-2xl p-2 sm:p-4 mt-20">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-7">
          <div className="relative size-28 shrink-0 overflow-hidden rounded-full bg-white/5 sm:size-32">
            {profile.image ? (
              <img
                src={profile.image}
                alt={displayName}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-white/5 text-white/35">
                <User className="size-12" />
              </div>
            )}

            {photoUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs">
                <Loader2 className="size-6 animate-spin text-vybe-gold" />
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoFile}
              disabled={photoUploading}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
              aria-label="Upload new profile photo"
              className="absolute bottom-0 inset-x-0 bg-black/65 py-1.5 flex items-center justify-center text-[10px] text-white/90 hover:text-white cursor-pointer transition-colors hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Camera className="size-3 mr-1" />
              {photoUploading ? "Uploading…" : "Change"}
            </button>
          </div>

          {photoError && (
            <p className="mt-2 text-xs text-red-300 sm:hidden">{photoError}</p>
          )}

          <div className="mt-5 min-w-0 flex-1 sm:mt-1">
            {photoError && (
              <p className="mb-2 hidden text-xs text-red-300 sm:block">{photoError}</p>
            )}
            <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-white/95">
              {displayName}
              {profile.age ? (
                <span className="ml-2.5 font-normal text-white/50 text-xl sm:text-2xl">
                  {profile.age}
                </span>
              ) : null}
            </h1>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-white/50 sm:justify-start">
              {profile.city ? (
                <span className="inline-flex items-center gap-1 text-white/70">
                  <MapPin className="size-3.5 text-vybe-gold" />
                  {profile.city}
                </span>
              ) : null}
              {profile.gender ? (
                <span className="capitalize text-white/50">{profile.gender}</span>
              ) : null}
            </div>

            {profile.about ? (
              <p className="mt-4 text-sm leading-relaxed text-white/75 whitespace-pre-wrap">
                {profile.about}
              </p>
            ) : (
              <p className="mt-4 text-sm italic text-white/40">No bio added yet.</p>
            )}
          </div>
        </div>

        {/* Favorite Artists */}
        {profile.favSingers && profile.favSingers.length > 0 && (
          <div className="mt-8 pt-4">
            <h2 className="font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-vybe-gold mb-3">
              Favorite Artists & Singers
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

        {/* Signature Track */}
        {profile.song && (
          <div className="mt-8 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-vybe-gold">
                Favorite Song
              </h2>
            </div>

            <div className="rounded-2xl bg-white/[0.04] p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                {profile.song.artworkUrl ? (
                  <img
                    src={profile.song.artworkUrl}
                    alt=""
                    className="size-13 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex size-13 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/35">
                    <AudioLines className="size-6" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white/95">
                    {profile.song.title}
                  </p>
                  <p className="truncate text-xs text-white/55 mt-0.5">
                    {profile.song.artist}
                  </p>
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
                    <Pause className="size-4" />
                  ) : (
                    <Play className="size-4 ml-0.5" />
                  )}
                </button>
              )}
            </div>

            {profile.song.story && (
              <div className="mt-4 rounded-xl bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-1.5">
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
