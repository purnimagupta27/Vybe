import { AudioLines, Pause, Play, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { searchTracks } from "../../lib/api";
import type { AudiusTrack } from "../../lib/api";
import type { OnboardingDraft } from "./draft";

type TrackSearchProps = {
  selected: OnboardingDraft["song"];
  onSelect: (track: OnboardingDraft["song"]) => void;
};

const inputClass =
  "w-full rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm text-white/90 outline-none transition-colors placeholder:text-white/30 focus:border-vybe-400 focus:bg-white/10";

const labelClass =
  "font-heading mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50";

const playButtonClass =
  "flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-vybe-accent hover:bg-vybe-accent hover:text-white";

function Artwork({ src }: { src: string | null }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        className="h-12 w-12 shrink-0 rounded-xl object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/35"
    >
      <AudioLines size={18} />
    </span>
  );
}

export default function TrackSearch({ selected, onSelect }: TrackSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AudiusTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playError, setPlayError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeTrackIdRef = useRef<string | null>(null);
  const selectedIdRef = useRef<string | null>(selected?.id ?? null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Media listeners live in the same effect as teardown, so the pause fired on
  // unmount cannot run a handler after the component is gone.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    function handlePlay() {
      setIsPlaying(true);
    }
    function handlePause() {
      setIsPlaying(false);
    }
    function handleEnded() {
      setIsPlaying(false);
    }
    function handleError() {
      if (!audio?.getAttribute("src")) return;
      setIsPlaying(false);
      setPlayError("Could not play this track.");
    }

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    };
  }, []);

  // Drop the loaded track when the selection changes away from it.
  useEffect(() => {
    const next = selected?.id ?? null;
    if (selectedIdRef.current === next) return;
    selectedIdRef.current = next;

    const activeId = activeTrackIdRef.current;
    if (!activeId || activeId === next) return;

    const audio = audioRef.current;
    activeTrackIdRef.current = null;
    setActiveTrackId(null);
    setIsPlaying(false);
    if (!audio) return;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }, [selected?.id]);

  // Debounced search, aborting the previous request on every new query and on unmount.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(false);

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      searchTracks(trimmed, controller.signal)
        .then((tracks) => {
          if (controller.signal.aborted) return;
          setResults(tracks);
          setHasSearched(true);
          setLoading(false);
        })
        .catch((cause: unknown) => {
          if (controller.signal.aborted) return;
          if (cause instanceof DOMException && cause.name === "AbortError") return;
          setError(cause instanceof Error ? cause.message : "Could not search songs.");
          setResults([]);
          setHasSearched(true);
          setLoading(false);
        });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function handlePlayError() {
    if (!mountedRef.current) return;
    setIsPlaying(false);
    setPlayError("Could not play this track.");
  }

  function startTrack(id: string, streamUrl: string) {
    const audio = audioRef.current;
    if (!audio) return;
    setPlayError(null);
    if (activeTrackIdRef.current !== id || !audio.getAttribute("src")) {
      audio.src = streamUrl;
      activeTrackIdRef.current = id;
      setActiveTrackId(id);
    }
    if (audio.paused) void audio.play().catch(handlePlayError);
  }

  function toggleTrack(id: string, streamUrl: string) {
    const audio = audioRef.current;
    if (!audio) return;
    setPlayError(null);
    if (activeTrackIdRef.current === id && audio.getAttribute("src")) {
      if (audio.paused) void audio.play().catch(handlePlayError);
      else audio.pause();
      return;
    }
    audio.src = streamUrl;
    activeTrackIdRef.current = id;
    setActiveTrackId(id);
    void audio.play().catch(handlePlayError);
  }

  function selectTrack(track: AudiusTrack) {
    onSelect({
      id: track.id,
      title: track.title,
      artist: track.artist,
      artworkUrl: track.artworkUrl,
      durationSeconds: track.durationSeconds,
      streamUrl: track.streamUrl,
      story: selected?.story ?? "",
    });
    startTrack(track.id, track.streamUrl);
  }

  function toggleSelected() {
    if (!selected) return;
    toggleTrack(selected.id, selected.streamUrl);
  }

  function clearSelection() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    activeTrackIdRef.current = null;
    setActiveTrackId(null);
    setIsPlaying(false);
    setPlayError(null);
    setQuery("");
    setResults([]);
    setHasSearched(false);
    setError(null);
    onSelect(null);
  }

  const selectedPlaying = Boolean(selected) && activeTrackId === selected?.id && isPlaying;
  const trimmedQuery = query.trim();

  return (
    <div>
      {selected ? (
        <div>
          <span className={labelClass}>Your song</span>
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <div className="flex items-center gap-3">
              <Artwork src={selected.artworkUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white/90">{selected.title}</p>
                <p className="truncate text-xs text-white/45">{selected.artist}</p>
              </div>
              <button
                type="button"
                onClick={toggleSelected}
                aria-label={selectedPlaying ? "Pause song" : "Play song"}
                aria-pressed={selectedPlaying}
                className={playButtonClass}
              >
                {selectedPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
              </button>
            </div>
            <button
              type="button"
              onClick={clearSelection}
              className="mt-4 cursor-pointer text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45 transition-colors hover:text-white/80"
            >
              Change song
            </button>
          </div>
        </div>
      ) : (
        <div>
          <label htmlFor="onboarding-song-search" className={labelClass}>
            Search a song
          </label>
          <div className="relative">
            <Search
              size={16}
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              id="onboarding-song-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for a song or artist"
              autoComplete="off"
              spellCheck={false}
              className={`${inputClass} pl-11`}
            />
          </div>
          <p className="mt-1.5 text-xs text-white/35">
            {trimmedQuery.length < 2
              ? "Type at least 2 characters to search Audius."
              : "Pick the song that says something about you."}
          </p>

          <div aria-live="polite">
            {loading ? <p className="mt-4 text-sm text-white/45">Searching Audius…</p> : null}
            {!loading && error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
            {!loading && !error && results.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {results.map((track) => {
                  const playing = activeTrackId === track.id && isPlaying;
                  return (
                    <li
                      key={track.id}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 transition-colors hover:border-white/20 hover:bg-white/[0.07]"
                    >
                      <button
                        type="button"
                        onClick={() => selectTrack(track)}
                        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                      >
                        <Artwork src={track.artworkUrl} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-white/90">
                            {track.title}
                          </span>
                          <span className="block truncate text-xs text-white/45">
                            {track.artist}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleTrack(track.id, track.streamUrl)}
                        aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`}
                        aria-pressed={playing}
                        className={playButtonClass}
                      >
                        {playing ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
            {!loading && !error && hasSearched && results.length === 0 ? (
              <p className="mt-4 text-sm text-white/45">No songs found.</p>
            ) : null}
          </div>
        </div>
      )}

      <p className="mt-5 text-[11px] tracking-wide text-white/30">Powered by Audius</p>

      {playError ? <p className="mt-3 text-xs text-red-300">{playError}</p> : null}

      <audio ref={audioRef} hidden />
    </div>
  );
}
