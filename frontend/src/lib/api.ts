/* Thin typed client for the Vybe backend (Express API, cookie-authenticated
   via Better Auth). Base URL rule matches lib/auth-client.ts. */

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export type FeedUser = {
  id: string;
  name: string;
  lastName: string | null;
  image: string | null;
  gender: "male" | "female" | "others" | null;
  age: number | null;
  about: string | null;
  favSingers: string[];
};

export type SwipeStatus = "interested" | "ignored";

type ApiErrorBody = { message?: string };

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
  });

  if (!response.ok) {
    let message: string | undefined;
    try {
      message = ((await response.json()) as ApiErrorBody).message;
    } catch {
      // Non-JSON error body — fall through to the generic message.
    }
    throw new Error(message ?? `Request failed (${response.status})`);
  }

  return response.json();
}

export async function fetchFeed(
  page: number,
): Promise<{ users: FeedUser[]; hasMore: boolean }> {
  const body = (await request(`/api/user/feed?page=${page}`)) as {
    data: FeedUser[];
    pagination: { hasMore: boolean };
  };
  return { users: body.data, hasMore: body.pagination.hasMore };
}

export async function sendSwipe(
  status: SwipeStatus,
  toUserId: string,
): Promise<void> {
  await request(`/api/request/send/${status}/${toUserId}`, { method: "POST" });
}
