import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { completeProfile, type CompleteProfileInput } from "../lib/api";
import { useProfile } from "../lib/profile-context";
import {
  clearDraft,
  emptyDraft,
  loadDraft,
  saveDraft,
  validateAbout,
  validateBasics,
  validatePhoto,
  validateSong,
} from "./onboarding/draft";
import type { OnboardingDraft } from "./onboarding/draft";
import StepAbout from "./onboarding/StepAbout";
import StepBasics from "./onboarding/StepBasics";
import StepPhoto from "./onboarding/StepPhoto";
import StepSong from "./onboarding/StepSong";
import WizardProgress from "./onboarding/WizardProgress";

const ghostButtonClass =
  "cursor-pointer rounded-full border border-white/25 px-6 py-2.5 text-sm font-medium text-white/90 transition-[background-color,border-color,opacity] duration-200 hover:border-white/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/25 disabled:hover:bg-transparent";

const primaryButtonClass =
  "cursor-pointer rounded-full bg-vybe-accent px-6 py-2.5 text-sm font-medium text-white transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:opacity-40";

function normalizeFavSingers(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

export default function Onboarding() {
  const { profile, loading, error, refresh } = useProfile();
  const navigate = useNavigate();
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

    if (profile.onboardingCompletedAt) {
      clearDraft(profileId);
      return;
    }

    const photoUrl =
      profile.image?.startsWith("https://res.cloudinary.com/") ? profile.image : null;
    const stored = loadDraft(profileId);
    if (stored) {
      // A refresh mid-wizard: keep what the user typed, but the server is the
      // source of truth for the uploaded photo.
      setDraft({ ...stored, photoUrl });
      return;
    }

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
      songStory: profile.song?.story ?? "",
      photoUrl,
    });
  }, [profile, profileId]);

  function update(patch: Partial<OnboardingDraft>) {
    setDraft((current) => {
      const next = { ...current, ...patch };
      if (profileId) saveDraft(profileId, next);
      return next;
    });
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

  async function submit() {
    if (submitting) return;
    setSubmitError(null);

    const basicsErrors = validateBasics(draft);
    const aboutErrors = validateAbout(draft);
    const songErrors = validateSong(draft);
    const photoErrors = validatePhoto(draft);

    const firstInvalid =
      Object.keys(basicsErrors).length > 0
        ? 0
        : Object.keys(aboutErrors).length > 0
          ? 1
          : Object.keys(songErrors).length > 0
            ? 2
            : Object.keys(photoErrors).length > 0
              ? 3
              : null;

    // The validators above guarantee these, but the checks narrow the types.
    if (firstInvalid !== null || !draft.song || !draft.gender) {
      setErrors({ ...basicsErrors, ...aboutErrors, ...songErrors, ...photoErrors });
      setStep(firstInvalid ?? 0);
      return;
    }

    const input: CompleteProfileInput = {
      name: draft.name.trim(),
      lastName: draft.lastName.trim(),
      gender: draft.gender,
      age: Number(draft.age),
      city: draft.city.trim(),
      about: draft.about.trim(),
      favSingers: normalizeFavSingers(draft.favSingers),
      song: { trackId: draft.song.id, story: draft.song.story.trim() },
    };

    setSubmitting(true);
    try {
      await completeProfile(input);
      if (profileId) clearDraft(profileId);
      // Completion already succeeded, so a failed refresh must not block the
      // redirect — the profile page refetches on its own.
      await refresh();
      navigate("/discover");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Could not finish your profile. Please try again.",
      );
      setSubmitting(false);
    }
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
        {step === 2 ? <StepSong draft={draft} update={update} errors={errors} /> : null}
        {step === 3 ? <StepPhoto draft={draft} update={update} errors={errors} /> : null}
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
            disabled={submitting}
            className={primaryButtonClass}
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void submit()}
            disabled={submitting}
            className={primaryButtonClass}
          >
            {submitting ? "Finishing…" : "Finish"}
          </button>
        )}
      </div>
    </main>
  );
}
