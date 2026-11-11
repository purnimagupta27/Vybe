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
