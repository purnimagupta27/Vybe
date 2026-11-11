import type { OnboardingDraft } from "./draft";

type StepBasicsProps = {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
  errors: Record<string, string>;
};

const inputClass =
  "w-full rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm text-white/90 outline-none transition-colors placeholder:text-white/30 focus:border-vybe-400 focus:bg-white/10";

const labelClass =
  "font-heading mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-300">{message}</p>;
}

export default function StepBasics({ draft, update, errors }: StepBasicsProps) {
  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="onboarding-name" className={labelClass}>
          Name
        </label>
        <input
          id="onboarding-name"
          type="text"
          value={draft.name}
          onChange={(event) => update({ name: event.target.value })}
          placeholder="Your first name"
          autoComplete="given-name"
          className={inputClass}
        />
        <FieldError message={errors.name} />
      </div>

      <div>
        <label htmlFor="onboarding-last-name" className={labelClass}>
          Last name
        </label>
        <input
          id="onboarding-last-name"
          type="text"
          value={draft.lastName}
          onChange={(event) => update({ lastName: event.target.value })}
          placeholder="Your last name"
          autoComplete="family-name"
          className={inputClass}
        />
        <FieldError message={errors.lastName} />
      </div>

      <div>
        <label htmlFor="onboarding-gender" className={labelClass}>
          Gender
        </label>
        <select
          id="onboarding-gender"
          value={draft.gender}
          onChange={(event) =>
            update({ gender: event.target.value as OnboardingDraft["gender"] })
          }
          className={`${inputClass} appearance-none`}
        >
          <option value="" disabled className="bg-vybe-900">
            Select…
          </option>
          <option value="male" className="bg-vybe-900">
            Male
          </option>
          <option value="female" className="bg-vybe-900">
            Female
          </option>
          <option value="others" className="bg-vybe-900">
            Others
          </option>
        </select>
        <FieldError message={errors.gender} />
      </div>

      <div>
        <label htmlFor="onboarding-age" className={labelClass}>
          Age
        </label>
        <input
          id="onboarding-age"
          type="number"
          min={18}
          max={120}
          inputMode="numeric"
          value={draft.age}
          onChange={(event) => update({ age: event.target.value })}
          placeholder="18–120"
          className={inputClass}
        />
        <FieldError message={errors.age} />
      </div>

      <div>
        <label htmlFor="onboarding-city" className={labelClass}>
          City
        </label>
        <input
          id="onboarding-city"
          type="text"
          value={draft.city}
          onChange={(event) => update({ city: event.target.value })}
          placeholder="Where you're based"
          autoComplete="address-level2"
          className={inputClass}
        />
        <FieldError message={errors.city} />
      </div>
    </div>
  );
}
