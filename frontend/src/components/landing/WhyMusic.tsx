import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";

const SAMPLE_ARTISTS = ["Prateek Kuhad", "The Local Train", "Cigarettes After Sex"];

/**
 * Editorial introduction explaining Vybe's music-first profile model, paired
 * with an interactive sample profile card.
 */
export default function WhyMusic() {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(28);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 1.5));
    }, 180);
    return () => window.clearInterval(timer);
  }, [playing]);

  return (
    <section id="why-vybe" className="border-t border-white/10">
      <div className="mx-auto grid max-w-5xl gap-12 px-6 py-24 sm:py-32 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
        <div>
          <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.2em] text-vybe-gold">
            Music as an introduction
          </p>
          <h2 className="font-heading mt-3 text-3xl font-semibold leading-tight text-white/90 sm:text-4xl">
            Skip the small talk. Start with a track.
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-white/60 sm:text-base">
            Most social apps flatten you into a stack of photos and a rehearsed
            one-liner. On Vybe, every profile centers around a single song you
            actually keep in rotation and the story behind why it stuck.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/60 sm:text-base">
            Your favorite artists live right alongside your bio, so a first
            message already has something real to talk about.
          </p>
        </div>

        <div>
          <div className="rounded-3xl border border-white/15 bg-white/[0.03] p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  aria-hidden="true"
                  className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 font-heading text-sm font-semibold text-vybe-gold"
                >
                  M
                </div>
                <div>
                  <p className="font-heading text-base font-semibold text-white/90">
                    Meera, 23
                  </p>
                  <p className="text-xs text-white/45">Bengaluru</p>
                </div>
              </div>
              <span className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                Signature track
              </span>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white/90">
                    Kho Gaye Hum Kahan
                  </p>
                  <p className="mt-0.5 truncate text-xs text-white/50">
                    Jasleen Royal, Prateek Kuhad
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setPlaying((current) => !current)}
                  aria-label={playing ? "Pause sample track preview" : "Play sample track preview"}
                  className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/25 text-white/90 transition-[background-color,border-color] duration-200 hover:border-white/40 hover:bg-white/10"
                >
                  {playing ? (
                    <Pause className="size-3.5" aria-hidden="true" />
                  ) : (
                    <Play className="ml-0.5 size-3.5" aria-hidden="true" />
                  )}
                </button>
              </div>

              <div className="mt-3.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-vybe-gold transition-[width] duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-white/75">
              &ldquo;Played this on repeat walking back from campus every
              evening during my final semester. Still feels like October
              rain.&rdquo;
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {SAMPLE_ARTISTS.map((artist) => (
                <span
                  key={artist}
                  className="rounded-full border border-white/15 bg-white/[0.03] px-3 py-1 text-xs text-white/70"
                >
                  {artist}
                </span>
              ))}
            </div>
          </div>

          <p className="mt-3 text-right text-xs text-white/35">
            Sample profile · One track, one story, favorite singers
          </p>
        </div>
      </div>
    </section>
  );
}
