import type { OnboardingDraft } from "./draft";
import TagInput from "./TagInput";

type StepAboutProps = {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
  errors: Record<string, string>;
};

const textareaClass =
  "w-full resize-none rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm leading-relaxed text-white/90 outline-none transition-colors placeholder:text-white/30 focus:border-vybe-400 focus:bg-white/10";

const labelClass =
  "font-heading mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-300">{message}</p>;
}

export default function StepAbout({ draft, update, errors }: StepAboutProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="onboarding-about" className={labelClass}>
            About you
          </label>
          <span className="text-xs tabular-nums text-white/35">{draft.about.length}/500</span>
        </div>
        <textarea
          id="onboarding-about"
          rows={6}
          maxLength={500}
          value={draft.about}
          onChange={(event) => update({ about: event.target.value })}
          placeholder="Tell people what moves you, what you're into, and the vibe you bring."
          className={textareaClass}
        />
        <FieldError message={errors.about} />
      </div>

      <div>
        <span className={labelClass}>Favorite singers</span>
        <TagInput
          values={draft.favSingers}
          onChange={(favSingers) => update({ favSingers })}
          placeholder="Type a singer and press Enter"
        />
        <FieldError message={errors.favSingers} />
      </div>
    </div>
  );
}
