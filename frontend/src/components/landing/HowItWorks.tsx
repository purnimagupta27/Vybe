const STEPS = [
  {
    number: "01",
    title: "Introduce yourself",
    description:
      "Add your name, city, age, a short bio, and the singers you actually keep on repeat.",
  },
  {
    number: "02",
    title: "Pick a song & its story",
    description:
      "Search tracks from Audius, preview them right inside the builder, and write what yours means to you.",
  },
  {
    number: "03",
    title: "Add one honest photo",
    description:
      "Upload a single profile photo and head into Discover to meet people on your wavelength.",
  },
] as const;

/**
 * Three-step breakdown of Vybe's onboarding and discovery flow.
 */
export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-white/10">
      <div className="mx-auto max-w-5xl px-6 py-24 sm:py-28">
        <div className="max-w-xl">
          <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-vybe-gold">
            How it works
          </p>
          <h2 className="font-heading mt-3 text-3xl font-semibold leading-tight text-white/90 sm:text-4xl">
            Four steps to build. Made for real taste.
          </h2>
        </div>

        <ol className="mt-14 grid divide-y divide-white/10 md:grid-cols-3 md:divide-x md:divide-y-0">
          {STEPS.map((step, index) => (
            <li
              key={step.number}
              className={`py-8 md:py-2 ${
                index === 0
                  ? "md:pr-8"
                  : index === 1
                    ? "md:px-8"
                    : "md:pl-8"
              }`}
            >
              <span className="font-heading text-xs font-semibold tracking-[0.2em] text-vybe-gold/90">
                {step.number}
              </span>
              <h3 className="font-heading mt-3 text-xl font-semibold text-white/90">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/55">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
