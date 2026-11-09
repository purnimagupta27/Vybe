# Feed Swipe Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `Feed.tsx` stub with a swipeable discovery feed — drag right = interested, left = ignored — persisted via the existing Express backend.

**Architecture:** Three small frontend files: an API client module (`lib/api.ts`) wrapping `GET /api/user/feed` and `POST /api/request/send/:status/:toUserId`, a presentational `SwipeCard` component owning the Framer Motion drag physics, and the `Feed` page orchestrating fetching, pagination, the card stack, and the desktop buttons. Backend is untouched — it already fully implements both endpoints.

**Tech Stack:** React 19 + Vite + TypeScript, Tailwind CSS v4 (`vybe-*` theme tokens in `frontend/src/index.css`), `motion` (Framer Motion), Better Auth session cookie auth.

**Spec:** `docs/superpowers/specs/2026-11-09-feed-swipe-design.md`

## Global Constraints

- Dark-only landing-page look: `#050306` base, `vybe-*` violet palette (`--color-vybe-accent: #8b5cf6`, `--color-vybe-gold: #b3ab80`), pill ghost buttons (`rounded-full border border-white/25 ... hover:bg-white/10`), `font-heading` for headings, `text-white/70`-range body text.
- API base URL: `import.meta.env.VITE_API_URL ?? "http://localhost:4000"` (same rule as `frontend/src/lib/auth-client.ts`). All fetches use `credentials: "include"`.
- Swipes are optimistic: the card leaves the stack immediately; the POST fires in the background.
- Package manager is pnpm (`devEngines.packageManager` in `frontend/package.json`).
- No test framework exists in this repo; verification is `pnpm typecheck`, `pnpm lint`, `pnpm build` in `frontend/`, plus a manual dev-server check (`backend` on :4000, `frontend` on :5173).

## Review Focus

- Empty feed (no other users in DB) — expect a calm empty state, not an error or infinite spinner.
- Failed swipe POST (e.g. backend down) — card still leaves the stack; an inline error appears; app does not crash or loop-fetch.
- Sign-out mid-session / 401 from feed API — expect redirect-to-home behavior, not a blank page.
- Very long `about` text or 30 favorite singers — card must not overflow; text truncates or scrolls within the card.
- Rapid double-swipe — only the top card responds; no duplicate POSTs for the same user.

---

### Task 1: API client module

**Files:**
- Create: `frontend/src/lib/api.ts`

**Interfaces:**
- Consumes: `VITE_API_URL` env var; backend endpoints `GET /api/user/feed?page=N`, `POST /api/request/send/:status/:toUserId` (cookie auth, `credentials: "include"`).
- Produces (used by Tasks 2–3):
  - `type FeedUser = { id: string; name: string; lastName: string | null; image: string | null; gender: "male" | "female" | "others" | null; age: number | null; about: string | null; favSingers: string[] }`
  - `type SwipeStatus = "interested" | "ignored"`
  - `async function fetchFeed(page: number): Promise<{ users: FeedUser[]; hasMore: boolean }>` — throws `Error` with the server's `message` on non-OK.
  - `async function sendSwipe(status: SwipeStatus, toUserId: string): Promise<void>` — throws `Error` on non-OK/non-2xx.

- [ ] **Step 1: Create `api.ts`** with the types and two functions above. One shared `request` helper does the base-URL join, `credentials: "include"`, and throws `Error((body as { message?: string }).message ?? fallback)` on failure.
- [ ] **Step 2: Verify**

Run: `cd frontend && pnpm typecheck && pnpm lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/api.ts
git commit -m "feat(feed): API client for feed and swipe endpoints"
```

### Task 2: SwipeCard component

**Files:**
- Create: `frontend/src/components/feed/SwipeCard.tsx`

**Interfaces:**
- Consumes: `FeedUser`, `SwipeStatus` from Task 1; `motion`, `useMotionValue`, `useTransform`, `AnimatePresence` from the `motion` package added in this task.
- Produces: `SwipeCard` with props `{ user: FeedUser; index: number; exitStatus: SwipeStatus | null; onExited: (status: SwipeStatus) => void; setExitStatus: (s: SwipeStatus | null) => void }`. Renders the top card's drag behavior: pointer drag with rotation (`rotate = x / 18` deg), stamps "INTERESTED" (green `border-emerald-400/60 text-emerald-300`) and "IGNORED" (`border-rose-400/60 text-rose-300`) whose opacity tracks drag direction, threshold ±120px or velocity flick, spring-back otherwise. On release-past-threshold or `exitStatus` set programmatically, animates x to ±1.5× card width and calls `onExited`. Card visual: `rounded-3xl border border-white/10 bg-vybe-850/80 backdrop-blur`, image with initials-avatar fallback, name + age, gender chip, `about` line-clamped, singers as small chips. `index` offsets scale/translateY for cards behind the top one.
- `package.json` gains `"motion": "^12"` dependency.

- [ ] **Step 1: Add the dependency**

Run: `cd frontend && pnpm add motion`
Expected: installs cleanly.

- [ ] **Step 2: Implement `SwipeCard`** per the interface above (drag physics, stamps, exit animation, card layout).
- [ ] **Step 3: Verify**

Run: `cd frontend && pnpm typecheck && pnpm lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/feed/SwipeCard.tsx frontend/package.json pnpm-lock.yaml
git commit -m "feat(feed): draggable swipe card with motion"
```

### Task 3: Feed page — fetch, stack, buttons, states

**Files:**
- Modify: `frontend/src/pages/Feed.tsx` (full rewrite of the stub; keep the existing session-guard and sign-out behavior)
- Modify: `frontend/src/App.tsx` — apply the `hero-backdrop` class for the `/feed` path too, so the page shares the landing page's glow.

**Interfaces:**
- Consumes: `fetchFeed`, `sendSwipe`, `FeedUser`, `SwipeStatus` (Task 1); `SwipeCard` (Task 2); `authClient.useSession()` from `frontend/src/lib/auth-client.ts`.
- Produces: the complete `/feed` page. State: `users: FeedUser[]`, `page`, `hasMore`, `loading`, `error: string | null`, `exitStatus: SwipeStatus | null`. Renders top 3 cards (only the top is draggable); below the stack, two pill ghost buttons with lucide `X` and `Heart` icons that set `exitStatus`; `onExited` optimistically pops the user off the stack and fires `sendSwipe` (catch → set `error` banner, card stays gone). When `users.length <= 3 && hasMore && !loading`, fetch the next page. Loading skeletons match the card's shape; empty state says no more people to discover.

- [ ] **Step 1: Rewrite `Feed.tsx`** per the interface above; tweak `App.tsx`'s backdrop ternary to `"hero-backdrop relative isolate"` for both paths.
- [ ] **Step 2: Verify**

Run: `cd frontend && pnpm typecheck && pnpm lint && pnpm build`
Expected: no errors; build succeeds.

- [ ] **Step 3: Manual check** — with backend (`pnpm dev` in `backend/`) and frontend running, sign in with Google, confirm: cards render in landing-page style, right-swipe persists as interested and left as ignored (verify via DB or by the profile disappearing from future pages), buttons animate the top card, next page loads when the stack runs low, empty state shows when exhausted, and swiping still works with the backend stopped (error banner, no crash).
- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Feed.tsx frontend/src/App.tsx
git commit -m "feat(feed): swipeable discovery feed wired to backend"
```
