export type OnboardingDraft = {
  name: string;
  lastName: string;
  gender: "male" | "female" | "others" | "";
  age: string;
  city: string;
  about: string;
  favSingers: string[];
  song: {
    id: string;
    title: string;
    artist: string;
    artworkUrl: string | null;
    durationSeconds: number | null;
    streamUrl: string;
    story: string;
  } | null;
  /* The story survives a song change, so it is kept separately from the
     selected track until the user picks a replacement. */
  songStory: string;
  photoUrl: string | null;
};

export const emptyDraft: OnboardingDraft = {
  name: "",
  lastName: "",
  gender: "",
  age: "",
  city: "",
  about: "",
  favSingers: [],
  song: null,
  songStory: "",
  photoUrl: null,
};

export function validateBasics(draft: OnboardingDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = draft.name.trim();
  const lastName = draft.lastName.trim();
  const age = Number(draft.age);

  if (name.length < 4 || name.length > 50) errors.name = "Name must be 4–50 characters.";
  if (lastName.length < 1 || lastName.length > 50) errors.lastName = "Last name is required.";
  if (!draft.gender) errors.gender = "Select a gender.";
  if (!Number.isInteger(age) || age < 18 || age > 120) errors.age = "Age must be 18–120.";
  if (draft.city.trim().length < 1 || draft.city.trim().length > 100) errors.city = "City is required.";
  return errors;
}

export function validateAbout(draft: OnboardingDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  const about = draft.about.trim();
  if (about.length < 1 || about.length > 500) errors.about = "Bio must be 1–500 characters.";
  if (draft.favSingers.length < 1) errors.favSingers = "Add at least one favorite singer.";
  if (draft.favSingers.length > 30) errors.favSingers = "Add at most 30 singers.";
  return errors;
}

export function validateSong(draft: OnboardingDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!draft.song) {
    errors.song = "Pick a song.";
  } else if (draft.song.story.trim().length < 1 || draft.song.story.trim().length > 500) {
    errors.story = "Story must be 1–500 characters.";
  }
  return errors;
}

export function validatePhoto(draft: OnboardingDraft): Record<string, string> {
  return draft.photoUrl ? {} : { photo: "Upload a profile photo." };
}

const DRAFT_KEY_PREFIX = "vybe:onboarding-draft:";

function isStoredSong(value: unknown): value is OnboardingDraft["song"] {
  if (value === null) return true;
  if (typeof value !== "object") return false;
  const song = value as Record<string, unknown>;
  return (
    typeof song.id === "string" &&
    typeof song.title === "string" &&
    typeof song.artist === "string" &&
    typeof song.streamUrl === "string" &&
    typeof song.story === "string" &&
    (song.artworkUrl === null || typeof song.artworkUrl === "string") &&
    (song.durationSeconds === null || typeof song.durationSeconds === "number")
  );
}

/**
 * Reads the draft a user typed before a refresh. The photo is deliberately not
 * read from storage: it is persisted server-side by the photo endpoint, so the
 * profile view is always the source of truth for it.
 */
export function loadDraft(userId: string): OnboardingDraft | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY_PREFIX + userId);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as Record<string, unknown>;
    const gender = record.gender;
    if (typeof record.name !== "string") return null;
    if (gender !== "" && gender !== "male" && gender !== "female" && gender !== "others") {
      return null;
    }
    if (
      !Array.isArray(record.favSingers) ||
      !record.favSingers.every((singer) => typeof singer === "string")
    ) {
      return null;
    }
    if (!isStoredSong(record.song)) return null;
    return {
      name: record.name,
      lastName: typeof record.lastName === "string" ? record.lastName : "",
      gender,
      age: typeof record.age === "string" ? record.age : "",
      city: typeof record.city === "string" ? record.city : "",
      about: typeof record.about === "string" ? record.about : "",
      favSingers: record.favSingers,
      song: record.song,
      songStory: typeof record.songStory === "string" ? record.songStory : "",
      photoUrl: null,
    };
  } catch {
    return null;
  }
}

/** Keeps typed progress across a refresh in the same tab. */
export function saveDraft(userId: string, draft: OnboardingDraft): void {
  const { name, lastName, gender, age, city, about, favSingers, song, songStory } = draft;
  try {
    window.sessionStorage.setItem(
      DRAFT_KEY_PREFIX + userId,
      JSON.stringify({ name, lastName, gender, age, city, about, favSingers, song, songStory }),
    );
  } catch {
    // Storage can be unavailable (private mode, quota); the draft still lives in memory.
  }
}

export function clearDraft(userId: string): void {
  try {
    window.sessionStorage.removeItem(DRAFT_KEY_PREFIX + userId);
  } catch {
    // Nothing to do if storage is unavailable.
  }
}
