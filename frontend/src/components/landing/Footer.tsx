import { AudioLines } from "lucide-react";

/**
 * Minimal footer matching Vybe's dark editorial landing style.
 */
export default function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <AudioLines className="size-5 text-vybe-gold" strokeWidth={2.5} aria-hidden="true" />
          <span className="text-sm font-bold tracking-[0.2em] text-white/80">
            VYBE
          </span>
          <span className="text-xs text-white/40">· Music-first connections</span>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-white/50">
          <a href="#why-vybe" className="transition-colors hover:text-white/85">
            Why Vybe
          </a>
          <a href="#how-it-works" className="transition-colors hover:text-white/85">
            How it works
          </a>
          <span className="text-white/35">&copy; {new Date().getFullYear()} Vybe</span>
        </div>
      </div>
    </footer>
  );
}
