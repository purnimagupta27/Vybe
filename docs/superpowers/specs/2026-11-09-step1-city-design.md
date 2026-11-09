# Step 1: User City — Short Design

**Date:** 2026-11-09
**Status:** Draft for approval

**Step 1 of the bigger card redesign** (city now; song + story + profile page next; distance/km-away explicitly excluded for now).

## Intent

Users set their city; every feed card shows it under the name (mock: "Chandigarh · 5 km away" — city only for now).

## Goals

- **DB:** new nullable `city varchar(100)` column on the existing `user` table (in `auth-schema.ts`), applied with `drizzle-kit push` (this repo has no migrations folder — push is the established workflow).
- **Backend:** `city` accepted by `PATCH /api/profile/edit` (zod: trimmed string, 1–100 chars, nullable, optional); returned by `GET /api/profile/view`, `GET /api/user/feed`, `GET /api/user/requests/received`, `GET /api/user/connections` so every surface has it.
- **Frontend — setting it:** an "Add your city" pill button next to the Discover header opens a small modal with a city autocomplete powered by the **Open-Meteo Geocoding API** (free, no key) — keeps city values clean instead of free-typed text. The modal auto-opens once if the signed-in user has no city yet (one `GET /api/profile/view` on load). Saves via `PATCH /api/profile/edit`.
- **Frontend — showing it:** `FeedUser` gains `city: string | null`; cards render the city with a small `MapPin` icon under name + age. No city → the line is simply omitted.
- "Music lover" badge in the mock is decorative; deferred to a later step.

## Non-goals

- No lat/lng, no distance calculation (city-only, per decision).
- No separate table — city belongs on `user` directly.
- No profile page yet (that's Step 2).

## Approaches considered

1. **Column on `user` + Open-Meteo autocomplete modal** — chosen; smallest change that makes the data real.
2. Free-typed text field — no dependency, but messy data ("chd", "Chandigarh ", "Chandīgarh").
3. Coordinates now — rejected: you said distance is out of scope; columns can be added later without breaking anything.

## Left to the builder

- Modal microcopy and Open-Meteo response field mapping (`name`, `admin1`, `country` → display string).
