# Edit profile — design

Date: 2026-11-13

## Intent

`/profile` has an "Edit details" button that links to `/onboarding`, but
`Onboarding.tsx` redirects every completed profile straight back to `/discover`.
The button is a no-op for real users. This adds a real editor for everything on a
profile except the email address.

## Goals

- "Edit details" opens `/profile/edit` and shows the current profile, prefilled.
- Everything except `email` is editable there: photo, name, last name, gender,
  age, city, bio, favorite singers, favorite song and its story.
- Save persists, refreshes the shared profile context, and returns to `/profile`.
- Cancel returns to `/profile` without saving the text fields.
- Same validation rules as onboarding; no rule is enforced only on the client.

## Non-goals

- Changing the email address. It is displayed read-only.
- Re-deciding connection requests, account deletion, password/session settings.
- Undoing a photo upload. Photos save as soon as they finish uploading, exactly
  like the existing "Change" button on `/profile`.
- A wizard. The edit screen is one page, not four steps.

## Approaches considered

1. **A dedicated page at `/profile/edit`** (chosen). One scrollable form; reuses
   the four onboarding sections as plain stacked sections. Requires adding
   `song` to `PATCH /api/profile/edit`.
2. **Reuse the onboarding wizard in edit mode.** Smallest diff and no backend
   work, but four "Continue" clicks to change a city, a "Finish" button that
   finishes nothing, and a mode flag threaded through onboarding's draft and
   redirect logic.
3. **Edit in place on `/profile`.** No navigation, but doubles an already long
   page and the edit state has no URL.

## Server

`PATCH /api/profile/edit` already exists and accepts `name`, `lastName`,
`gender`, `age`, `city`, `about`, `favSingers`. It rejects `image` and `email`,
and it refuses to clear a field once the profile is complete. Two changes:

- Add an optional `song: { trackId, story }` to `editProfileSchema`, reusing the
  existing `songSchema`.
- In the handler, when `song` is present: re-resolve the track with
  `getAudiusTrack` (400 if it no longer exists — same rule as `/complete`), then
  upsert `profileSong` on `userId`. `song` is lifted out of the body before
  `db.update(user).set(...)`, so no unknown column is written, and the user-row
  update is skipped entirely when the request contains only a song.

`photo` needs no change: `POST /api/profile/photo` already writes `image`.

The route stays under `requireAuth` only, as today, so an incomplete profile can
still use it.

## Client

- `src/pages/ProfileEdit.tsx` (new), route `/profile/edit` under `RequireAuth` +
  `RequireProfile`.
- Builds an `OnboardingDraft` from the profile and renders `StepPhoto`,
  `StepBasics`, `StepAbout`, `StepSong` stacked with section headings, a Save and
  a Cancel button, the email shown as a disabled field, and an inline submit
  error.
- Validates with the existing `validateBasics` / `validateAbout` /
  `validateSong` before submitting, then sends every field plus the song.
- `api.ts`: add `editProfile(input)`, a PATCH to `/api/profile/edit`.
- `Profile.tsx`: point "Edit details" at `/profile/edit`.
- `App.tsx`: register the route.

Two small extractions so the new page does not copy onboarding:

- `draftFromProfile(profile)` moves the profile→draft mapping out of
  `Onboarding.tsx` into `draft.ts`.
- `normalizeFavSingers` moves out of `Onboarding.tsx` into `draft.ts`.

## Decisions left to the builder

- Exact spacing and section framing on the edit page.
- Whether Save stays disabled while anything is uploading. (It should.)
- Copy for the read-only email row.
