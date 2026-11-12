# Discover swipe feed — design

Date: 2026-11-12

## Intent

Turn the placeholder `/discover` page into the product's core loop: one photo-first
profile card at a time, swipe left to `ignored`, swipe right to `interested`, wired to
the existing `POST /api/request/send/:status/:toUserId` endpoint.

The feed endpoint does not exist yet, so this adds it with cursor pagination.

## Goals

- `GET /api/feed` returns a stable page of swipeable profiles.
- One card visible at a time; the next card is preloaded so the handoff is instant.
- Drag, buttons, and arrow keys all produce the same decision.
- Optimistic UI: the card leaves immediately and returns with an inline error if the
  request fails.

## Non-goals

- Undo / re-deciding. `POST /api/request/send` refuses any pair that already has a row,
  so undo would need a new delete endpoint. Out of scope.
- Match celebration, chat, filters, gender or city preferences. All out of scope.
- A visible stack of cards. The user asked for one card at a time.

## Approaches considered

1. **Pagination.** Cursor (chosen) vs offset. Every swipe inserts a `connectionRequest`
   row that must be excluded from later pages, which makes an offset window shift:
   pages skip and repeat profiles. A cursor anchored to a row cannot shift.
2. **Swipe motion.** Hand-rolled Pointer Events + CSS transforms (chosen) vs adding
   `motion`. Pointer events cover touch, mouse and pen in one path, add no dependency,
   and match the hand-rolled CSS motion already in `index.css`.
3. **Queue.** One visible card with the next preloaded behind it (chosen) vs rendering
   the whole loaded page as a stack.

## Feed contract

`GET /api/feed?cursor=<userId>&limit=10` → `200`

```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "…",
        "name": "…",
        "lastName": "…",
        "age": 24,
        "gender": "female",
        "image": "https://res.cloudinary.com/…",
        "city": "Pune",
        "about": "…",
        "favSingers": ["…"],
        "song": {
          "title": "…",
          "artist": "…",
          "artworkUrl": "…",
          "durationSeconds": 210,
          "story": "…",
          "streamUrl": "…"
        }
      }
    ],
    "nextCursor": "…  or null"
  }
}
```

- Ordered `created_at DESC, id DESC`. The cursor is the last seen user id; the server
  resolves it to that row's exact `created_at`, so no timestamp precision is lost.
- Excludes the viewer, profiles without `onboarding_completed_at`, and any user with a
  `connectionRequest` row in either direction with the viewer.
- Page size default 10, max 20. Fetch `limit + 1` to decide `nextCursor` honestly.
- A cursor that no longer resolves means end of feed (`items: []`, `nextCursor: null`).
- Invalid `limit` or unparseable cursor → `400`.

## Card

Photo-first, single card, `max-w-[360px]`, 3:4.5, rounded-3xl glass border.

- Full-bleed image, bottom scrim from `#050306`.
- Name + age, city with pin icon.
- Music strip: artwork, title, artist, play/pause against the Audius `streamUrl`.
- `story` clamped to two lines, then favourite-singer chips (first three, `+n`).
- Drag stamps: `INTERESTED` in gold on the right, `IGNORE` in rose on the left.

## Motion

- `pointerdown/move/up` with pointer capture; `touch-action: none` on the card.
- `translate3d(dx, dy*0.15, 0) rotate(dx/22deg)`.
- Past ±110px the card flies out over 240ms and the decision fires; below it springs
  back over 300ms with `cubic-bezier(0.23, 1, 0.32, 1)`.
- `prefers-reduced-motion`: no rotation, short fade.

## Files

- `backend/src/validations/feed.validation.ts` + test — query parsing.
- `backend/src/routes/feed.routes.ts` — the endpoint.
- `backend/src/app.ts` — mount under auth + complete-profile guards.
- `frontend/src/lib/api.ts` — `getFeed`, `sendConnectionRequest`.
- `frontend/src/components/discover/SwipeCard.tsx` — card + drag.
- `frontend/src/pages/Discover.tsx` — queue, prefetch, optimistic decisions.
