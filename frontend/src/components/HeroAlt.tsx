import { AudioLines, AudioWaveform } from "lucide-react";
import girl from "../assets/girl-headphones.png";

/* Variant hero for the A/B decision — same Zound backdrop, no copy,
   girl cutout anchored bottom-right over a palette glow ring. */

const NAV_LINKS = ["Home", "Genres", "Playlists", "Waitlist"];

export default function HeroAlt() {
  return (
    <section className="hero-backdrop relative isolate flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {/* Navbar variant — logo left, centre links, outline pill right */}
      <nav className="relative z-20 flex h-16 items-center justify-between border-b border-white/10 px-6 sm:px-10">
        <a href="/" className="group flex select-none items-center gap-2">
          <AudioLines
            className="h-7 w-7 text-vybe-gold transition-transform duration-300 group-hover:scale-110"
            strokeWidth={2.5}
          />
          <span className="text-xl font-extrabold tracking-[0.2em] text-white">
            VYBE
          </span>
        </a>

        <ul className="hidden items-center gap-9 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link}>
              <a
                href="#"
                className="text-sm font-medium text-white/70 transition-colors duration-200 hover:text-white"
              >
                {link}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#join"
          className="rounded-full border border-white/25 px-6 py-2 text-sm font-medium text-white/90 transition-[background-color,border-color] duration-200 hover:border-white/40 hover:bg-white/10"
        >
          Join Now
        </a>
      </nav>

      {/* Stage — glow ring behind her torso, girl emerging bottom-right,
          heading lockup centre-left over the glow like the reference */}
      <div className="relative flex flex-1 items-center">
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

        {/* Heading — beats icon left of a two-line heading, exactly like the
            reference lockup; "Connect." wears the crimson accent */}
        <div
          className="rise-in relative z-20 max-w-2xl px-8 pb-24 sm:px-14 md:pb-0 md:pl-[22%] lg:pl-[24%]"
          style={{ animationDelay: "520ms" }}
        >
          <div className="flex items-center gap-5 sm:gap-8">
            <AudioWaveform
              aria-hidden
              className="h-9 w-9 shrink-0 text-white/90 sm:h-12 sm:w-12"
              strokeWidth={2.25}
            />
            <h1 className="text-[clamp(1.9rem,4.2vw,3.4rem)] font-large leading-[1.08] tracking-tight text-white">
              Don&rsquo;t just listen
              <br />
              Connect
            </h1>
          </div>
        </div>

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
