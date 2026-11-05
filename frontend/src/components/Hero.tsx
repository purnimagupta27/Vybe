import { AudioLines } from "lucide-react";
import girl from "../assets/girl-headphones.png";

/* Primary hero — Zound backdrop, beats-icon heading lockup, girl cutout
   anchored bottom-right over a palette glow ring. The navbar is a separate
   component that floats above this section on the shared backdrop. */

export default function Hero() {
  return (
    <section className="relative isolate flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {/* Stage — glow ring behind her torso, girl emerging bottom-right,
          heading lockup nudged left of centre */}
      <div className="relative flex flex-1 items-center justify-center pb-14 md:justify-start md:pb-20 md:pl-[12%] lg:pl-[13%]">
        {/* Palette glow ring (crimson band + violet core) — replaces the reference's orange */}
        <div
          aria-hidden
          className="absolute right-[-2%] top-[2%] z-0 aspect-square w-[min(78vh,760px)]"
          style={{
            backgroundImage: [
              "radial-gradient(closest-side circle at 50% 50%, transparent 0% 39%, rgba(217,27,51,0.22) 49%, rgba(217,27,51,0.1) 55%, transparent 68%)",
              "radial-gradient(closest-side circle at 50% 50%, rgba(109,28,94,0.42), transparent 72%)",
              "radial-gradient(closest-side circle at 50% 50%, rgba(74,13,32,0.5), transparent 82%)",
            ].join(","),
          }}
        />

        {/* Heading — large AudioLines icon left of the two-line heading,
            centred in the stage */}
        <div
          className="rise-in relative z-20 px-8 pb-24 sm:px-14 md:pb-0"
          style={{ animationDelay: "520ms" }}
        >
          <div className="flex items-center gap-9 sm:gap-16">
            <AudioLines
              className="h-16 w-16 shrink-0 text-vybe-gold transition-transform duration-300 group-hover:scale-110 sm:h-20 sm:w-20 lg:h-24 lg:w-24"
              strokeWidth={2.5}
            />
            <div className="relative">
              {/* Eyebrow — overlay anchored above the heading so the existing
                  lockup (icon + two lines) stays put, like the mock's
                  "// From Voice To" */}
              {/* <span className="absolute bottom-full left-0 mb-5 block whitespace-nowrap text-[clamp(0.8rem,1.15vw,1.05rem)] font-normal tracking-wide text-white/80 sm:mb-6">
                 beyond music
              </span> */}
              <h1 className="font-heading whitespace-nowrap tracking-wider text-[clamp(1.5rem,5.5vw,4.6rem)] font-semibold leading-[1.1] tracking-tight text-white/80">
                Don&rsquo;t just listen.
                <br />
                Connect.
              </h1>
            </div>
          </div>
        </div>

        {/* Supporting copy — the mock's bottom-left paragraph slot, absolutely
            placed so the heading lockup above is untouched */}
        <p
          className="rise-in absolute bottom-[13%] left-6 z-20 max-w-md text-[clamp(0.85rem,1.1vw,1.05rem)] font-normal leading-relaxed text-white/80 sm:left-10"
          style={{ animationDelay: "680ms" }}
        >
          Connect with people who feel your music, understand your vibe, and
          share your rhythm.
        </p>

        {/* Girl — entrance on the wrapper, ambient drift nested inside so the
            two never fight; girl-soft dims + masks her so the HD cutout
            melts into the backdrop instead of popping off it. */}
        <div className="figure-in absolute bottom-0 right-0 z-10 h-[84%] max-md:h-[72%] sm:h-[86%] lg:h-[92%]">
          <img
            src={girl}
            alt="Girl with headphones listening to music"
            draggable={false}
            className="figure-drift girl-soft block h-full w-auto max-w-none object-bottom"
          />
        </div>
      </div>
    </section>
  );
}
