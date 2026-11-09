# Feed Swipe Page — Short Design

**Date:** 2026-11-09
**Status:** Draft for approval

## Intent

Replace the empty `frontend/src/pages/Feed.tsx` stub with a swipeable card feed: drag right = **interested**, drag left = **ignored**, each swipe persisted to the existing backend. UI must match the landing page (dark `#050306` plum backdrop, `vybe-*` violet palette, crimson/violet radial glows, pill ghost buttons, Raleway headings, `text-white/70` body text).

## Goals

- Swipe cards via pointer/touch drag (Framer Motion `drag`), with rotation while dragging and spring exit off-screen.
- Direction stamps visible while dragging: "INTERESTED" (green) on right drag, "IGNORED" (red) on left drag.
- Threshold-based commitment: past ~120px horizontal (or fast flick) the card commits; otherwise springs back.
- Desktop-friendly buttons (ignore / interest) that animate the top card the same way as a swipe.
- Card content: image (or initial avatar fallback), name, age, gender, about, favorite singers as chips.
- Pagination: when cards run low (< 3 remaining), fetch next page from `GET /api/user/feed?page=N` using the `pagination.hasMore` flag. Show an empty state when no more profiles.
- Loading skeletons in the landing-page style; auth-guarded (redirect to `/` if no session, same as current stub).

## Non-goals

- No matches/received-requests UI (backend endpoints exist, separate feature).
- No undo of swipes. No profile detail view beyond the card.
- No new router; keep the existing hand-rolled path check in `App.tsx`.

## Approaches considered

1. **Framer Motion (`motion`) drag cards** — chosen. Best swipe physics for little code; supports programmatic animation for the buttons.
2. Hand-rolled pointer events + CSS transforms — no dep, but more code and worse spring physics.
3. Button-only — loses the requested swipe feel.

## Decisions made

- Library: `motion` (Framer Motion's successor package), added to `frontend`.
- API wiring: `POST /api/request/send/interested/:userId` and `POST /api/request/send/ignored/:userId`, `credentials: include`, base URL from `VITE_API_URL` (same as `auth-client.ts`). Calls are optimistic: the card leaves the stack immediately; a failed call shows a toast-style inline error and does **not** re-insert the card (kept simple; the user is excluded server-side only after a successful send, so a failed swipe just means they may see that profile again next page load — acceptable).
- Styling: Tailwind classes only, using the existing `vybe-*` theme tokens and `.hero-backdrop`-style glow behind the card stack.

## Left to the builder

- Exact card layout/spacing, animation values (spring config, rotation factor, threshold), and empty-state copy.
