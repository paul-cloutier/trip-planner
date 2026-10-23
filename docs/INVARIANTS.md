# Invariants

> The things that must be true of this system. Short enough to read, updated
> whenever reality changes.

## 1. Actors

| Actor | Authenticated? | Can read | Can write | Notes |
|---|---|---|---|---|
| Anonymous visitor | no | nothing (sign-in page only: password or emailed code) | nothing | Shared guides will add a read-only public path later |
| Space member | yes (email code) | their space, its members, its saves; all places | saves in their space; rename their space | No open sign-up: accounts are created by hand |
| Server code (service role) | secret key | everything | `places` only, from `addPlace` and the import script | `places` is shared across spaces, so it only ever holds data we fetched from OpenStreetMap ourselves, never values from a request |
| Me, in Supabase Studio | dashboard login | everything | everything | Creating users and invites, for now |

## 2. The tenancy boundary

- Boundary key: `space_id`.
- Every table holding user data carries it: `saves`, `space_members`,
  `space_invites`, `trips`, `trip_legs`, `trip_items`. Composite foreign keys
  stop a leg, item or save from pointing across spaces. Exception: `places` holds only public facts from Google and
  is shared across spaces. Nothing a person wrote goes in `places`.
- Enforced in both: row level security through `is_space_member(space_id)`,
  and an explicit `.eq("space_id", …)` in application queries.
- A query on a user-data table that does not filter by `space_id` is a bug.

## 3. Trust boundaries

- [x] Server action bodies (sign-in: zod)
- [ ] Query and path parameters (none yet)
- [ ] Webhooks: none
- [x] Third-party API responses from: Photon (OpenStreetMap search), parsed with zod in `src/lib/photon.ts`
- [ ] File uploads: Google Takeout CSVs (coming with import); photos later
- [ ] User text rendered as HTML: via, why, tags. Rendered as text only.
- [x] Environment variables at boot (`src/lib/env.ts`)

## 4. Public surface

| Path | Why it is public | Rate limited? |
|---|---|---|
| `/sign-in` and its actions | You sign in before you have a session | Supabase auth's own OTP limits |

## 5. Secrets

| Name | Where it lives | Rotatable without downtime? |
|---|---|---|
| Supabase secret key (`SUPABASE_SECRET_KEY`) | Server env; used in `src/lib/supabase/admin.ts` (server-only) and scripts | yes (new key, then revoke) |
| Google Places API key | Not added yet. Server env only | yes |

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are public
by design; RLS is the boundary.

## 6. Things that grow

| Thing | Grows with | Bounded query? | Index on the hot column? |
|---|---|---|---|
| `saves` | places we save, thousands over years | yes, 500 on the pool page | `(space_id, added_at desc)` |
| `trip_items` | places pulled into trips | yes, 1000 per trip page | `(trip_id, day)` |
| `places` | every distinct place anyone saves | lookups by id / `google_place_id` | unique on `google_place_id`, `city` |

## 7. Things that are expensive

| Operation | Cost driver | Rate limited | Idempotent on retry |
|---|---|---|---|
| Place search (Photon) | Komoot's free public service, fair use | debounced 300 ms in the browser; no server limit yet (two users) | yes: places upsert on `(osm_type, osm_id)` |
| Sign-in email | Supabase email quota | Supabase OTP limits | yes |

## 8. Data I would hate to leak

- Our why and via notes: who recommended a place, private opinions.
- Where we have been and when (`status = been`, `visited_on`). That is a travel
  history.
- Trip dates, once trips exist: when we are away from home.
- Member emails.

## 9. Data I would hate to lose

| Data | Backup | Tested restore? |
|---|---|---|
| `saves` (years of notes) | Supabase daily backup on the hosted project | no |

## 10. Known accepted risks

| Risk | Why it is acceptable today | What would change that |
|---|---|---|
| Any signed-in user can read every row of `places` (policy `using (true)`) | It holds only public facts (name, position, address, OSM tag); with one space, nobody else exists to learn which places we saved | A second space: then the set of places reveals what other spaces saved, and reads should go through `saves` |
| Users and invites are created by hand in Studio | Two people use it | A third person, or shared guides |
| The first six migrations (the five schema migrations, then `narrow_grants`) were pushed to the hosted `trips` project by hand (`supabase db push`, 2026-10-23), not by the GitHub integration | The integration would not attach to the project after three tries; nothing else was blocking first use, and `narrow_grants` closes the old default grants rather than waiting on it | Closed 2026-10-23: the integration now deploys `main` (it applied `index_added_by_created_by` on its own). Every later migration goes through it; any further hand push is not covered by this entry |
