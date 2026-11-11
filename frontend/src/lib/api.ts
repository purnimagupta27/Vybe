const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type ApiErrorBody = { message?: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
  });
  if (!response.ok) {
    let message: string | undefined;
    try {
      message = ((await response.json()) as ApiErrorBody).message;
    } catch {
      // non-JSON error body
    }
    throw new Error(message ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export type AudiusTrack = {
  id: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  durationSeconds: number | null;
  streamUrl: string;
};

export type ProfileSong = {
  provider: string;
  providerTrackId: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  durationSeconds: number | null;
  story: string;
  streamUrl: string;
};

export type Profile = {
  id: string;
  name: string;
  lastName: string | null;
  email: string;
  image: string | null;
  gender: "male" | "female" | "others" | null;
  age: number | null;
  city: string | null;
  about: string | null;
  favSingers: string[];
  onboardingCompletedAt: string | null;
  song: ProfileSong | null;
};

export type CompleteProfileInput = {
  name: string;
  lastName: string;
  gender: "male" | "female" | "others";
  age: number;
  city: string;
  about: string;
  favSingers: string[];
  song: { trackId: string; story: string };
};

export async function getProfile(): Promise<Profile> {
  const body = await request<{ data: Profile }>("/api/profile/view");
  return body.data;
}

export async function uploadProfilePhoto(file: File): Promise<string> {
  const form = new FormData();
  form.append("photo", file);
  const body = await request<{ data: { url: string } }>("/api/profile/photo", {
    method: "POST",
    body: form,
  });
  return body.data.url;
}

export async function searchTracks(query: string, signal?: AbortSignal): Promise<AudiusTrack[]> {
  const body = await request<{ data: AudiusTrack[] }>(
    `/api/music/search?q=${encodeURIComponent(query)}`,
    { signal },
  );
  return body.data;
}

export async function completeProfile(input: CompleteProfileInput): Promise<void> {
  await request("/api/profile/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
