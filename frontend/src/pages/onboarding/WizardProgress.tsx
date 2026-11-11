const STEPS = ["Basics", "About", "Song", "Photo"] as const;

export default function WizardProgress({ current }: { current: number }) {
  return (
    <ol className="flex items-start gap-2" aria-label="Onboarding progress">
      {STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li
            key={label}
            className="flex flex-1 flex-col items-center gap-2"
            aria-current={active ? "step" : undefined}
          >
            <span
              aria-hidden
              className={[
                "flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors",
                done || active
                  ? "border-vybe-accent bg-vybe-accent text-white"
                  : "border-white/15 text-white/30",
                active ? "ring-2 ring-vybe-accent/30 ring-offset-2 ring-offset-[#050306]" : "",
              ].join(" ")}
            >
              {index + 1}
            </span>
            <span
              className={[
                "text-[10px] uppercase tracking-[0.18em]",
                done || active ? "text-white/70" : "text-white/30",
              ].join(" ")}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
