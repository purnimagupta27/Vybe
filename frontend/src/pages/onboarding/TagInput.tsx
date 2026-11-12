import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { CheckCircle2, Mic } from "lucide-react";
import { searchSingers, type AudiusArtist } from "../../lib/api";

type TagInputProps = {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
};

const MAX_TAGS = 30;

const inputClass =
  "w-full rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm text-white/90 outline-none transition-colors placeholder:text-white/30 focus:border-vybe-400 focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50";

export default function TagInput({ values, onChange, placeholder }: TagInputProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<AudiusArtist[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const atLimit = values.length >= MAX_TAGS;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search to Audius
  useEffect(() => {
    const trimmed = input.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setOpen(true);
    setHighlightedIndex(-1);

    const timer = setTimeout(() => {
      searchSingers(trimmed, controller.signal)
        .then((results) => {
          if (!controller.signal.aborted) {
            // Filter out singers already added
            setSuggestions(results.filter((a) => !values.includes(a.name)));
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setSuggestions([]);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        });
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [input, values]);

  function add(raw: string) {
    const value = raw.trim();
    if (!value || atLimit || values.includes(value)) return;
    onChange([...values, value]);
    setInput("");
    setOpen(false);
    setSuggestions([]);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (open && suggestions.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        return;
      }
      if (event.key === "Enter" && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        event.preventDefault();
        add(suggestions[highlightedIndex].name);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
    }

    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add(input);
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    if (!next.includes(",")) {
      setInput(next);
      return;
    }
    const [head, ...rest] = next.split(",");
    add(head);
    setInput(rest.join(",").trimStart());
  }

  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap gap-2">
        {values.map((value, index) => (
          <span
            key={value}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1 pl-3 pr-1.5 text-xs text-white/80"
          >
            {value}
            <button
              type="button"
              onClick={() => removeAt(index)}
              aria-label={`Remove ${value}`}
              className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white/90"
            >
              &times;
            </button>
          </span>
        ))}
      </div>

      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (input.trim().length >= 2 && suggestions.length > 0) setOpen(true);
          }}
          disabled={atLimit}
          placeholder={atLimit ? "Limit reached (30)" : (placeholder ?? "Search Audius artist or type name")}
          className={`${inputClass} ${values.length > 0 ? "mt-3" : ""}`}
        />

        {open && input.trim().length >= 2 && (
          <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-60 overflow-y-auto rounded-2xl border border-white/15 bg-[#0e0914]/95 p-1.5 shadow-2xl backdrop-blur-xl">
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-3 text-xs text-white/50">
                <div className="size-3.5 animate-spin rounded-full border border-white/20 border-t-vybe-gold" />
                <span>Searching Audius artists…</span>
              </div>
            ) : suggestions.length > 0 ? (
              <ul role="listbox">
                {suggestions.map((artist, index) => {
                  const isHighlighted = index === highlightedIndex;
                  return (
                    <li
                      key={artist.id}
                      role="option"
                      aria-selected={isHighlighted}
                      onMouseDown={(e) => {
                        e.preventDefault(); // prevent blur
                        add(artist.name);
                      }}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                        isHighlighted ? "bg-white/10 text-white" : "text-white/85 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
                        {artist.profilePictureUrl ? (
                          <img
                            src={artist.profilePictureUrl}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <Mic className="size-3.5 text-white/40" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-medium">{artist.name}</span>
                          {artist.isVerified && (
                            <CheckCircle2 className="size-3 text-vybe-gold shrink-0" />
                          )}
                        </div>
                        {artist.handle && (
                          <span className="block truncate text-[11px] text-white/40">
                            @{artist.handle}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-3 py-2.5 text-xs text-white/45">
                No matching artist on Audius. Press <kbd className="rounded bg-white/10 px-1 py-0.5 text-[10px] text-white/70">Enter</kbd> to add custom.
              </div>
            )}
          </div>
        )}
      </div>

      <p className="mt-1.5 text-xs text-white/35 flex items-center justify-between">
        <span>
          {atLimit
            ? "You can add up to 30 singers."
            : "Pick from Audius suggestions or press Enter to add"}
        </span>
        <span className="text-[10px] tracking-wide text-white/25">Audius Artists</span>
      </p>
    </div>
  );
}
