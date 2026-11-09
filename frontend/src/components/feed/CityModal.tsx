import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search, X } from "lucide-react";
import { updateProfile } from "../../lib/api";

type GeocodeResult = {
  id: number;
  name: string;
  admin1?: string;
  country?: string;
};

type CityModalProps = {
  open: boolean;
  initialCity: string;
  onClose: () => void;
  onSaved: (city: string) => void;
};

function displayName(place: GeocodeResult): string {
  const region = place.admin1 ?? place.country;
  return region && region !== place.name
    ? `${place.name}, ${region}`
    : place.name;
}

export default function CityModal({
  open,
  initialCity,
  onClose,
  onSaved,
}: CityModalProps) {
  const [query, setQuery] = useState(initialCity);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery(initialCity);
      setResults([]);
      setError(null);
      // Focus after the overlay paints.
      const id = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(id);
    }
  }, [open, initialCity]);

  /* Debounced Open-Meteo city search — free, no API key. */
  useEffect(() => {
    if (!open) return;
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            term,
          )}&count=5&language=en&format=json`,
        );
        if (!response.ok) throw new Error("City lookup failed");
        const body = (await response.json()) as { results?: GeocodeResult[] };
        setResults(body.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query, open]);

  if (!open) return null;

  const choose = async (place: GeocodeResult) => {
    const city = displayName(place);
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ city });
      onSaved(city);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save your city. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose your city"
        className="w-full max-w-md rounded-3xl border border-white/10 bg-vybe-900/95 p-6 shadow-2xl shadow-black/60"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-heading text-xl font-semibold text-white/90">
              Where are you based?
            </h3>
            <p className="mt-1 text-sm text-white/50">
              Your city shows on your discovery card.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white/80"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 focus-within:border-vybe-accent/60">
          <Search size={16} className="text-white/40" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Start typing a city…"
            className="w-full bg-transparent text-sm text-white/90 placeholder:text-white/35 focus:outline-none"
          />
          {searching && <Loader2 size={16} className="animate-spin text-white/40" />}
        </div>

        <div className="mt-3 space-y-1">
          {results.map((place) => (
            <button
              key={place.id}
              disabled={saving}
              onClick={() => void choose(place)}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-white/80 transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              <MapPin size={15} className="shrink-0 text-vybe-gold" />
              <span className="truncate">{displayName(place)}</span>
            </button>
          ))}
          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <p className="px-3 py-2 text-sm text-white/40">
              No matching city — try another spelling.
            </p>
          )}
        </div>

        {error && (
          <p className="mt-3 rounded-xl border border-rose-400/30 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
