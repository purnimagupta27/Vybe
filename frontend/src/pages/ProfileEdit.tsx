import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { editProfile } from "../lib/api";
import { useProfile } from "../lib/profile-context";
import {
  draftFromProfile,
  normalizeFavSingers,
  validateAbout,
  validateBasics,
  validateSong,
} from "./onboarding/draft";
import type { OnboardingDraft } from "./onboarding/draft";
import StepAbout from "./onboarding/StepAbout";
import StepBasics from "./onboarding/StepBasics";
import StepPhoto from "./onboarding/StepPhoto";
import StepSong from "./onboarding/StepSong";

const ghostButtonClass =
  "cursor-pointer rounded-full border border-white/25 px-6 py-2.5 text-sm font-medium text-white/90 transition-[background-color,border-color,opacity] duration-200 hover:border-white/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/25 disabled:hover:bg-transparent";

const primaryButtonClass =
  "cursor-pointer rounded-full bg-vybe-accent px-6 py-2.5 text-sm font-medium text-white transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:opacity-40";

const labelClass =
  "font-heading mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50";

const sectionHeadingClass = "font-heading mb-4 text-lg text-white/85";

const emailInputClass =
  "w-full cursor-not-allowed rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/40 outline-none";

export default function ProfileEdit() {
  const { profile, loading, error, refresh } = useProfile();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    if (profile && !draft) setDraft(draftFromProfile(profile));
  }, [profile, draft]);

  function update(patch: Partial<OnboardingDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  async function submit() {
    if (!draft) return;

    const nextErrors = {
      ...validateBasics(draft),
      ...validateAbout(draft),
      ...validateSong(draft),
    };
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // Narrowed by the validators above; the guards keep TypeScript honest.
    if (!draft.gender || !draft.song) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await editProfile({
        name: draft.name.trim(),
        lastName: draft.lastName.trim(),
        gender: draft.gender,
        age: Number(draft.age),
        city: draft.city.trim(),
        about: draft.about.trim(),
        favSingers: normalizeFavSingers(draft.favSingers),
        song: { trackId: draft.song.id, story: draft.song.story.trim() },
      });
      await refresh();
      navigate("/profile");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Could not save your profile. Please try again.",
      );
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 text-sm text-white/50">
        <div className="mb-3 size-6 animate-spin rounded-full border-2 border-white/20 border-t-vybe-gold" />
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

  if (!profile || !draft) return null;

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-lg px-6 py-10">
      <header className="mb-8">
        <Link
          to="/profile"
          className="group inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/70 transition-all hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back</span>
        </Link>
        <h1 className="font-heading mt-6 text-3xl text-white/85">Edit profile</h1>
        <p className="mt-2 text-sm text-white/50">Change anything except your email.</p>
      </header>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="mb-10">
          <label htmlFor="profile-email" className={labelClass}>
            Email
          </label>
          <input
            id="profile-email"
            type="email"
            value={profile.email}
            disabled
            className={emailInputClass}
          />
          <p className="mt-1.5 text-xs text-white/40">Email can&apos;t be changed.</p>
        </div>

        <StepPhoto
          draft={draft}
          update={update}
          errors={errors}
          onUploadingChange={setPhotoUploading}
        />

        <h2 className={`${sectionHeadingClass} mt-10`}>Basics</h2>
        <StepBasics draft={draft} update={update} errors={errors} />

        <h2 className={`${sectionHeadingClass} mt-10`}>Your story</h2>
        <StepAbout draft={draft} update={update} errors={errors} />

        <h2 className={`${sectionHeadingClass} mt-10`}>Favorite song</h2>
        <StepSong draft={draft} update={update} errors={errors} />

        {submitError && <p className="mt-8 text-sm text-red-300">{submitError}</p>}

        <div className="mt-8 flex items-center gap-3">
          <button type="button" onClick={() => navigate("/profile")} className={ghostButtonClass}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || photoUploading}
            className={primaryButtonClass}
          >
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </main>
  );
}
