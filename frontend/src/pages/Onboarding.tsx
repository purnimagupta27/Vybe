import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useProfile } from "../lib/profile-context";
import {
  emptyDraft,
  validateAbout,
  validateBasics,
  validatePhoto,
  validateSong,
} from "./onboarding/draft";
import type { OnboardingDraft } from "./onboarding/draft";
import StepAbout from "./onboarding/StepAbout";
import StepBasics from "./onboarding/StepBasics";
import WizardProgress from "./onboarding/WizardProgress";

const ghostButtonClass =
  "cursor-pointer rounded-full border border-white/25 px-6 py-2.5 text-sm font-medium text-white/90 transition-[background-color,border-color,opacity] duration-200 hover:border-white/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/25 disabled:hover:bg-transparent";

const primaryButtonClass =
  "cursor-pointer rounded-full bg-vybe-accent px-6 py-2.5 text-sm font-medium text-white transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:opacity-40";

function PlaceholderStep({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-12 text-center">
      <h2 className="font-heading text-xl text-white/80">{title}</h2>
      <p className="mt-2 text-sm text-white/45">{body}</p>
    </div>
  );
}

export default function Onboarding() {
  const { profile, loading, error, refresh } = useProfile();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<OnboardingDraft>(emptyDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const prefilledRef = useRef<string | null>(null);
  const profileId = profile?.id ?? null;

  useEffect(() => {
    if (!profile || !profileId) return;
    if (prefilledRef.current === profileId) return;
    prefilledRef.current = profileId;
    setDraft({
      name: profile.name,
      lastName: profile.lastName ?? "",
      gender: profile.gender ?? "",
      age: profile.age === null ? "" : String(profile.age),
      city: profile.city ?? "",
      about: profile.about ?? "",
      favSingers: [...profile.favSingers],
      song: profile.song
        ? {
            id: profile.song.providerTrackId,
            title: profile.song.title,
            artist: profile.song.artist,
            artworkUrl: profile.song.artworkUrl,
            durationSeconds: profile.song.durationSeconds,
            streamUrl: profile.song.streamUrl,
            story: profile.song.story,
          }
        : null,
      photoUrl:
        profile.image?.startsWith("https://res.cloudinary.com/") ? profile.image : null,
    });
  }, [profile, profileId]);

  function update(patch: Partial<OnboardingDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function next() {
    setSubmitError(null);
    const stepErrors =
      step === 0
        ? validateBasics(draft)
        : step === 1
          ? validateAbout(draft)
          : step === 2
            ? validateSong(draft)
            : validatePhoto(draft);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;
    setStep((current) => Math.min(current + 1, 3));
  }

  function back() {
    setErrors({});
    setSubmitError(null);
    setSubmitting(false);
    setStep((current) => Math.max(current - 1, 0));
  }

  if (loading) {
    return (
      <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-lg px-6 py-10">
        <p className="text-sm text-white/50">Loading your profile…</p>
      </main>
    );
  }

  if (!profile && error) {
    return (
      <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-lg px-6 py-10">
        <h1 className="font-heading text-3xl text-white/85">Build your profile</h1>
        <p className="mt-4 text-sm text-white/60">{error}</p>
        <button type="button" onClick={() => void refresh()} className={`mt-6 ${ghostButtonClass}`}>
          Try again
        </button>
      </main>
    );
  }

  if (profile?.onboardingCompletedAt) return <Navigate to="/discover" replace />;

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-lg px-6 py-10">
      <header className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">
          Step {step + 1} of 4
        </p>
        <h1 className="font-heading mt-2 text-3xl text-white/85">Build your profile</h1>
      </header>

      <WizardProgress current={step} />

      <div className="mt-10">
        {step === 0 ? <StepBasics draft={draft} update={update} errors={errors} /> : null}
        {step === 1 ? <StepAbout draft={draft} update={update} errors={errors} /> : null}
        {step === 2 ? (
          <PlaceholderStep
            title="Pick your song"
            body="Song search and your track story land here next."
          />
        ) : null}
        {step === 3 ? (
          <PlaceholderStep
            title="Add a profile photo"
            body="Photo upload and finishing your profile land here next."
          />
        ) : null}
      </div>

      {submitError ? <p className="mt-6 text-sm text-red-300">{submitError}</p> : null}

      <div className="mt-10 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={back}
          disabled={step === 0 || submitting}
          className={ghostButtonClass}
        >
          Back
        </button>

        {step < 3 ? (
          <button
            type="button"
            onClick={next}
            disabled={step >= 2 || submitting}
            className={primaryButtonClass}
          >
            Continue
          </button>
        ) : (
          <button type="button" disabled className={primaryButtonClass}>
            Finish
          </button>
        )}
      </div>
    </main>
  );
}
