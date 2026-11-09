# Feed Music Player (Audius) — Short Design

**Date:** 2026-11-09
**Status:** Draft for approval

## Intent

Each feed swipe card gets a play button that plays a **full song** by that person's first favorite singer, streamed free from **Audius** (no API key — `app_name` param only, verified live: full-length `audio/mpeg` streams).

## Goals

- One play/pause button on the top card, labeled with the singer's name ("Play Arijit Singh").
- One player at a time; playback **stops when the card swipes away** (drag or button) — never overlapping audio.
- A mini "now playing" bar (title • artist • pause button) below the card stack, styled in the `vybe-*` pill language.
- Loading state on the button while Audius search resolves; friendly inline note if Audius has no match (mainstream singers often won't be there — expected with the Audius-only choice).
- Choose the singer with the best Audius coverage: try each of the user's `favSingers` in order until a track is found (first-listed first).

## Non-goals

- No queue, seek bar, volume control, or background playback across pages.
- No YouTube/Spotify mainstream playback (user opted for Audius-only, no key).

## Decisions made

- Client: `frontend/src/lib/audius.ts` — `searchTrackForArtists(artists: string[]): Promise<{ track, artist } | null>` (uses `https://api.audius.co/v1/tracks/search?query=...&app_name=Vybe`, picks first result with a stream), plus `streamUrl(trackId)`.
- State lives in `Feed.tsx` (`nowPlaying` + `<audio>` ref); `SwipeCard` receives `onPlay`/`isPlaying` props — no player library.
- `<audio>` element is rendered once in `Feed.tsx` (not inside cards) so it survives card removal; swipe handler pauses it.

## Left to the builder

- Button/bar microcopy, exact animation timing.
