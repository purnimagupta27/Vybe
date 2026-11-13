# Edit Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make "Edit details" on `/profile` open a real editor at `/profile/edit` where a user can change everything on their profile except their email.

**Architecture:** A new page composes the four existing onboarding form sections (`StepPhoto`, `StepBasics`, `StepAbout`, `StepSong`) as stacked sections over the same `OnboardingDraft` object, saving with one `PATCH /api/profile/edit` that is extended to accept the favorite song. Profile fields are written to `user`; the song is upserted into `profileSong`; the photo keeps using the existing upload endpoint.

**Tech Stack:** React 19, React Router 7, TypeScript, Tailwind v4 (frontend); Express 5, Drizzle ORM, Zod 4, Vitest (backend).

**Spec:** `docs/superpowers/specs/2026-11-13-profile-edit-design.md`

## Global Constraints

- No new dependencies in either package.
- Onboarding behaviour must not change: same validation, same redirect for completed profiles, same submit path.
- The edit body stays `.strict()`; `email` and `image` are never writable through `PATCH /api/profile/edit`. `image` is only written by `POST /api/profile/photo`.
- The frontend has no test runner. Frontend tasks are gated on `pnpm typecheck` and `pnpm build`, plus the manual checklist in Task 5. Do not add a test framework.
- Backend verification is `pnpm exec tsc --noEmit` and `pnpm test` (Vitest).
- Commits are local only. Do not push.
- `frontend/src/pages/Profile.tsx` and `frontend/src/components/Navbar.tsx` already contain the user's uncommitted copy edits. Task 4 touches `Profile.tsx`; its commit will therefore include the one-line "Signature Track" → "Favorite Song" change that is already there. Leave `Navbar.tsx` alone.

## Review Focus

- A PATCH containing only `song` (no profile fields) must save the song and must never emit `update "user" set` with no columns → Task 1 test "accepts a song-only edit"; Task 2 branch guard.
- A PATCH whose Audius track has been deleted must return 400 with a "pick another one" message and must not write a user row → Task 2.
- A PATCH carrying `email` must be rejected and must never reach the database → Task 1 test "rejects email".
- A song object with unknown keys or a malformed `trackId` must be rejected → Task 1 tests "rejects unknown song keys" and "rejects a malformed track id".
- Text at the limits must be accepted and one character over rejected: `about` 500, story 500, 30 favorite singers → Task 1 tests.

---

### Task 1: Accept the song in `editProfileSchema`

**Files:**
- Modify: `backend/src/validations/profile.validation.ts:81-95`
- Test: `backend/src/validations/profile.validation.test.ts` (append a new `describe` block)

**Interfaces:**
- Consumes: `songSchema`, `editProfileSchema` already defined in `profile.validation.ts`.
- Produces: `editProfileSchema` accepts an optional `song: { trackId: string; story: string }`; `EditProfileInput` (exported) gains `song?: { trackId: string; story: string }`. Task 2 relies on both.

- [ ] **Step 1: Write the failing tests**

Append to `profile.validation.test.ts`, importing `editProfileSchema` alongside `completeProfileSchema`:

```ts
describe("editProfileSchema", () => {
  it("accepts a partial edit with a song", () => {
    expect(
      editProfileSchema.safeParse({ city: "Pune", song: valid.song }).success,
    ).toBe(true);
  });

  it("accepts a song-only edit", () => {
    expect(editProfileSchema.safeParse({ song: valid.song }).success).toBe(true);
  });

  it("rejects a song with an empty story", () => {
    expect(
      editProfileSchema.safeParse({ song: { trackId: "ZlwB7", story: "  " } }).success,
    ).toBe(false);
  });

  it("rejects a malformed track id", () => {
    expect(
      editProfileSchema.safeParse({ song: { trackId: "not a track!", story: "Good." } }).success,
    ).toBe(false);
  });

  it("rejects unknown song keys", () => {
    expect(
      editProfileSchema.safeParse({
        song: { trackId: "ZlwB7", story: "Good.", streamUrl: "https://evil.example/x.mp3" },
      }).success,
    ).toBe(false);
  });

  it("rejects email", () => {
    expect(editProfileSchema.safeParse({ email: "new@example.com" }).success).toBe(false);
  });

  it("rejects image", () => {
    expect(editProfileSchema.safeParse({ image: "https://example.com/x.png" }).success).toBe(false);
  });

  it("accepts text at the limits and rejects one character over", () => {
    expect(editProfileSchema.safeParse({ about: "a".repeat(500) }).success).toBe(true);
    expect(editProfileSchema.safeParse({ about: "a".repeat(501) }).success).toBe(false);
    expect(
      editProfileSchema.safeParse({ song: { trackId: "ZlwB7", story: "a".repeat(500) } }).success,
    ).toBe(true);
    expect(
      editProfileSchema.safeParse({ song: { trackId: "ZlwB7", story: "a".repeat(501) } }).success,
    ).toBe(false);
    expect(
      editProfileSchema.safeParse({ favSingers: Array.from({ length: 30 }, (_, i) => `s${i}`) })
        .success,
    ).toBe(true);
    expect(
      editProfileSchema.safeParse({ favSingers: Array.from({ length: 31 }, (_, i) => `s${i}`) })
        .success,
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test -- src/validations/profile.validation.test.ts`
Expected: FAIL — "accepts a partial edit with a song" and "accepts a song-only edit" fail because `.strict()` rejects the unknown key `song`.

- [ ] **Step 3: Add the field**

In `editProfileSchema`, after `favSingers`:

```ts
    song: songSchema.optional(),
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test -- src/validations/profile.validation.test.ts`
Expected: PASS, 14 tests (6 existing + 8 new).

- [ ] **Step 5: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no output, exit 0.

- [ ] **Step 6: Commit**

```bash
git add backend/src/validations/profile.validation.ts backend/src/validations/profile.validation.test.ts
git commit -m "feat(profile): accept a song in edit validation"
```

---

### Task 2: Persist the song in `PATCH /api/profile/edit`

**Files:**
- Modify: `backend/src/routes/profile.routes.ts:97-163`

**Interfaces:**
- Consumes: `editProfileSchema` / `EditProfileInput` from Task 1; `getAudiusTrack` (already imported at line 7); `profileSong` (already imported at line 6).
- Produces: `PATCH /api/profile/edit` saves `song` and still returns `200 { message: "Profile updated successfully." }`. No response shape change.

- [ ] **Step 1: Split the song out of the body**

Replace `const updates = req.body;` with:

```ts
    // The song lives in its own table, so it is lifted out before the user row
    // is updated. `profileUpdates` is what actually maps onto the `user` table.
    const { song, ...profileUpdates } = req.body as EditProfileInput;
```

Keep the existing empty-body guard, but measure the whole body (a song-only edit is valid):

```ts
    if (Object.keys(req.body).length === 0) {
```

- [ ] **Step 2: Point the clear-guard at `profileUpdates`**

The `requiredKeys` loop currently reads `(updates as Record<string, unknown>)[key]`. Change `updates` to `profileUpdates`. `song` is not in `requiredKeys`, so a song-only edit skips the loop harmlessly.

- [ ] **Step 3: Upsert the song before the user row**

Leave the existing user update below it. Insert before `const [updatedUser]`:

```ts
    if (song) {
      // Re-resolve the track so a song deleted on Audius cannot be saved, the
      // same rule the complete-profile endpoint applies.
      const track = await getAudiusTrack(song.trackId);
      if (!track) {
        return res.status(400).json({
          status: "error",
          message: "That song is no longer available. Please pick another one.",
        });
      }

      // Retryable by design: song first, then the user row. Neon's HTTP driver
      // has no transaction to wrap these in.
      await db
        .insert(profileSong)
        .values({
          userId: currentUser.id,
          provider: "audius",
          providerTrackId: track.id,
          title: track.title,
          artist: track.artist,
          artworkUrl: track.artworkUrl,
          durationSeconds: track.durationSeconds,
          story: song.story,
        })
        .onConflictDoUpdate({
          target: profileSong.userId,
          set: {
            provider: "audius",
            providerTrackId: track.id,
            title: track.title,
            artist: track.artist,
            artworkUrl: track.artworkUrl,
            durationSeconds: track.durationSeconds,
            story: song.story,
          },
        });
    }
```

- [ ] **Step 4: Guard the user update against an empty `set`**

Wrap the existing update so a song-only request never runs it:

```ts
    if (Object.keys(profileUpdates).length > 0) {
      const [updatedUser] = await db
        .update(user)
        .set(profileUpdates)
        .where(eq(user.id, currentUser.id))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
        });
      }
    }
```

The `200` response stays where it is, outside the block.

- [ ] **Step 5: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: no output, exit 0. If `.set(profileUpdates)` complains about `song`, the destructure in Step 1 was not applied.

- [ ] **Step 6: Run the backend suite**

Run: `pnpm test`
Expected: all 6 files pass, 33 tests.

- [ ] **Step 7: Commit**

```bash
git add backend/src/routes/profile.routes.ts
git commit -m "feat(profile): save the favorite song on edit"
```

---

### Task 3: Share the draft helpers

**Files:**
- Modify: `frontend/src/pages/onboarding/draft.ts`
- Modify: `frontend/src/pages/Onboarding.tsx:28-40, 63-94`

**Interfaces:**
- Consumes: `Profile` from `../../lib/api` (add `import type { Profile } from "../../lib/api";`).
- Produces: `draftFromProfile(profile: Profile): OnboardingDraft` and `normalizeFavSingers(values: string[]): string[]`, both exported from `draft.ts`. Task 4 imports both.

- [ ] **Step 1: Add `normalizeFavSingers` to `draft.ts`**

Move the function verbatim from `Onboarding.tsx` (lines 28-40) and export it.

- [ ] **Step 2: Add `draftFromProfile` to `draft.ts`**

It returns exactly what `Onboarding.tsx` lines 73-94 build today: `name`, `lastName ?? ""`, `gender ?? ""`, `age` as a string or `""`, `city ?? ""`, `about ?? ""`, a copied `favSingers`, `song` mapped from `profile.song` (id from `providerTrackId`, plus `title`, `artist`, `artworkUrl`, `durationSeconds`, `streamUrl`, `story`) or `null`, `songStory` from `profile.song?.story ?? ""`, and `photoUrl` — the image only when it starts with `https://res.cloudinary.com/`, else `null`.

- [ ] **Step 3: Use both from `Onboarding.tsx`**

Delete the local `normalizeFavSingers` and the profile→draft object literal. In the prefill effect keep the stored-draft branch exactly as it is; replace the fallback with:

```ts
    setDraft(draftFromProfile(profile));
```

The `photoUrl` computation is still needed for the stored branch — keep it local there. Import `normalizeFavSingers` and `draftFromProfile` from `./onboarding/draft`.

- [ ] **Step 4: Typecheck and build**

Run: `pnpm typecheck; "EXIT=$LASTEXITCODE"` in `frontend/`
Expected: `EXIT=0`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/onboarding/draft.ts frontend/src/pages/Onboarding.tsx
git commit -m "refactor(onboarding): share draft helpers with profile editing"
```

---

### Task 4: The edit page, its route, and its link

**Files:**
- Create: `frontend/src/pages/ProfileEdit.tsx`
- Modify: `frontend/src/pages/onboarding/StepPhoto.tsx:7-11, 27-35`
- Modify: `frontend/src/lib/api.ts` (after `completeProfile`)
- Modify: `frontend/src/App.tsx:46-53`
- Modify: `frontend/src/pages/Profile.tsx:110-115`

**Interfaces:**
- Consumes: `draftFromProfile`, `normalizeFavSingers`, `validateBasics`, `validateAbout`, `validateSong` from `./onboarding/draft`; `StepPhoto`, `StepBasics`, `StepAbout`, `StepSong`; `useProfile()`; the new `editProfile()`.
- Produces: `editProfile(input: EditProfileInput): Promise<void>` in `lib/api.ts`, where `EditProfileInput` is `{ name: string; lastName: string; gender: "male" | "female" | "others"; age: number; city: string; about: string; favSingers: string[]; song: { trackId: string; story: string } }`.

- [ ] **Step 1: Add `editProfile` to `lib/api.ts`**

```ts
export type EditProfileInput = {
  name: string;
  lastName: string;
  gender: "male" | "female" | "others";
  age: number;
  city: string;
  about: string;
  favSingers: string[];
  song: { trackId: string; story: string };
};

export async function editProfile(input: EditProfileInput): Promise<void> {
  await request("/api/profile/edit", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
```

- [ ] **Step 2: Let `StepPhoto` report that it is uploading**

Add an optional prop so the page can disable Save while a photo upload is mid-flight:

```ts
  onUploadingChange?: (uploading: boolean) => void;
```

Destructure it in the component signature and add, after the existing state declarations:

```ts
  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);
```

The caller must pass a stable function (a `useState` setter). Onboarding passes nothing and is unchanged.

- [ ] **Step 3: Create `ProfileEdit.tsx`**

Shape:

- `const { profile, loading, error, refresh } = useProfile();` and `const navigate = useNavigate();`
- State: `draft: OnboardingDraft | null`, `errors: Record<string, string>`, `submitting: boolean`, `submitError: string | null`, `photoUploading: boolean`.
- Effect: once `profile` exists and `draft` is null, `setDraft(draftFromProfile(profile))`.
- `update(patch)` spreads into the draft, matching onboarding.
- `submit()`: run `validateBasics`, `validateAbout`, `validateSong`; if any errors, `setErrors({ ...all })` and return. Otherwise require `draft.song` and `draft.gender` (same narrowing as `Onboarding.tsx:148`), call:

```ts
      await editProfile({
        name: draft.name.trim(),
        lastName: draft.lastName.trim(),
        gender: draft.gender,
        age: Number(draft.age),
        city: draft.city.trim(),
        about: draft.about.trim(),
        favSingers: normalizeFavSingers(draft.favSingers),
        song: { trackId: draft.song.id, story: draft.song.story.trim() },
      });
      await refresh();
      navigate("/profile");
```

  On failure set `submitError` from `err instanceof Error ? err.message : "Could not save your profile. Please try again."` and re-enable the button.
- `cancel()` navigates to `/profile`.
- Guard rendering: while `loading` or `!draft`, show the same spinner block `Profile.tsx:72-79` uses; if `!profile && error`, show the error plus a Try again button calling `refresh()`.

Layout, in this order inside `<main className="mx-auto min-h-[calc(100vh-4rem)] max-w-lg px-6 py-10">`:

1. Header: `<Link to="/profile">` back arrow + "Back", then `h1` "Edit profile" and a one-line subtitle "Change anything except your email."
2. Read-only email: a label "Email", a disabled input with `value={profile.email}`, and the helper text "Email can't be changed."
3. `<StepPhoto draft={draft} update={update} errors={errors} onUploadingChange={setPhotoUploading} />`
4. Section heading "Basics" + `<StepBasics ... />`
5. Section heading "About you" + `<StepAbout ... />`
6. Section heading "Favorite song" + `<StepSong ... />`
7. `{submitError && <p className="text-sm text-red-300">{submitError}</p>}`
8. Actions: a ghost "Cancel" button (`navigate("/profile")`) and a primary "Save changes" button, `disabled={submitting || photoUploading}`, label "Saving…" while submitting. Reuse the ghost/primary class strings from `Onboarding.tsx:22-26`.

Section headings use `font-heading mb-4 text-lg text-white/85` and sit 10 units apart (`mt-10`).

- [ ] **Step 4: Register the route**

In `App.tsx`, above the `/profile` route:

```tsx
              <Route
                path="/profile/edit"
                element={
                  <RequireAuth>
                    <RequireProfile>
                      <ProfileEdit />
                    </RequireProfile>
                  </RequireAuth>
                }
              />
```

Add the import next to the existing `Profile` import.

- [ ] **Step 5: Point "Edit details" at the new page**

In `Profile.tsx:111`, change `to="/onboarding"` to `to="/profile/edit"`. Leave the label and styling alone.

- [ ] **Step 6: Typecheck and build**

Run: `pnpm build; "EXIT=$LASTEXITCODE"` in `frontend/`
Expected: `EXIT=0`, build completes.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/ProfileEdit.tsx frontend/src/pages/onboarding/StepPhoto.tsx frontend/src/lib/api.ts frontend/src/App.tsx frontend/src/pages/Profile.tsx
git commit -m "feat(profile): add the profile edit page"
```

---

### Task 5: Verify end to end

**Files:** none modified.

**Interfaces:**
- Consumes: everything above.
- Produces: evidence that the feature works, or a list of failures.

- [ ] **Step 1: Run both suites**

```bash
cd backend && pnpm exec tsc --noEmit && pnpm test
cd ../frontend && pnpm build
```

Expected: backend typecheck silent, tests all pass; frontend build reports `✓ built`.

- [ ] **Step 2: Walk the manual checklist with a signed-in account**

Start both dev servers and check, in order:

1. `/profile` → "Edit details" navigates to `/profile/edit` (previously it bounced to `/discover`).
2. Every field is prefilled from the profile, including the song title, story and artist chips.
3. Change the bio → "Save changes" → lands on `/profile` and the new bio is shown.
4. Change the song → save → the profile shows the new title/artist, and `/discover` still loads.
5. Change the photo → it saves on upload; "Save changes" stays disabled until the upload finishes.
6. "Cancel" after editing text returns to `/profile` without saving the text. A photo changed before cancelling stays changed (expected).
7. Submit with the bio emptied → inline "Bio must be 1–500 characters." and no navigation.
8. The email field is visible, disabled, and unchanged after a save.

- [ ] **Step 3: Report**

Report the command output and the checklist result. Do not claim success without them.

## Self-Review

- **Spec coverage:** page + route (Task 4), prefilled draft (Tasks 3-4), all fields except email (Task 4), server-side song persistence (Tasks 1-2), photo via the existing endpoint (Task 4), cancel/save behaviour (Task 4), read-only email (Task 4). Deleting an account or re-deciding requests is out of scope by the spec.
- **Step scan:** every step names a file and either exact code, an exact signature, or an exact command with expected output. The one place a builder must invent markup — the edit page's layout — is constrained by an ordered list and the tokens reused from existing files.
- **Type consistency:** `EditProfileInput` is defined once in `lib/api.ts` and mirrors the server's `editProfileSchema` minus the nullable/optional wrappers; `song.trackId` ↔ `draft.song.id` and `song.story` ↔ `draft.song.story` are the only rename, and it is stated in Task 4.
- **Review Focus:** each of the five lines is pinned by a named test in Task 1 or a branch instruction in Task 2.
- **Proportion:** the plan is longer than the spec because the spec is one page; no step transcribes a component whose signature and tests already determine it.
