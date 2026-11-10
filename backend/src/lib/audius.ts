const AUDIUS_BASE = "https://api.audius.co/v1";

export type AudiusTrack = {
  id: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  durationSeconds: number | null;
};

function appName(): string {
  return process.env.AUDIUS_APP_NAME ?? "Vybe";
}

export function mapAudiusTrack(raw: unknown): AudiusTrack | null {
  if (!raw || typeof raw !== "object") return null;
  const track = raw as Record<string, unknown>;
  if (typeof track.id !== "string" || typeof track.title !== "string") return null;
  const artist =
    track.user && typeof track.user === "object" && typeof (track.user as { name?: unknown }).name === "string"
      ? (track.user as { name: string }).name
      : "Unknown artist";
  const artwork =
    track.artwork && typeof track.artwork === "object"
      ? ((track.artwork as Record<string, unknown>)["480x480"] ??
        (track.artwork as Record<string, unknown>)["150x150"])
      : null;
  return {
    id: track.id,
    title: track.title,
    artist,
    artworkUrl: typeof artwork === "string" ? artwork : null,
    durationSeconds: typeof track.duration === "number" ? track.duration : null,
  };
}

export function buildAudiusStreamUrl(trackId: string): string {
  return `${AUDIUS_BASE}/tracks/${encodeURIComponent(trackId)}/stream?app_name=${encodeURIComponent(appName())}`;
}

export async function searchAudiusTracks(query: string, limit = 20): Promise<AudiusTrack[]> {
  const url = `${AUDIUS_BASE}/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}&app_name=${encodeURIComponent(appName())}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Audius search is unavailable right now.");
  const body = (await response.json()) as { data?: unknown[] };
  return (body.data ?? [])
    .filter((item) => (item as { is_streamable?: boolean }).is_streamable !== false)
    .map(mapAudiusTrack)
    .filter((track): track is AudiusTrack => track !== null);
}

export async function getAudiusTrack(trackId: string): Promise<AudiusTrack | null> {
  try {
    const response = await fetch(
      `${AUDIUS_BASE}/tracks/${encodeURIComponent(trackId)}?app_name=${encodeURIComponent(appName())}`,
    );
    if (!response.ok) return null;
    const body = (await response.json()) as { data?: unknown };
    return mapAudiusTrack(body.data);
  } catch {
    return null;
  }
}
