# Platform notes

Things about this deployment that an agent cannot infer from the code. Sits
alongside `docs/INVARIANTS.md`.

## Environments

| Environment | Vercel scope | Supabase project | Public? |
|---|---|---|---|
| Production | `kei-inc/trip-planner`, builds from `main` | `trips` (`dzdgfbmwwzwfbycerimn`) | yes, behind sign-in |
| Preview | `kei-inc/trip-planner`, builds from `play` and PRs | the same `trips` project | Vercel's default protection |
| Local | development | Supabase CLI on Docker (`supabase start`) | no |

**Do previews touch production data?** Yes. There are two of us and one
database; a second project is not worth it yet. The cost: a migration on
`play` only reaches the hosted database when it merges to `main`, so a preview
of a branch with a new migration runs against the old tables. Try schema
changes locally first.

## Supabase

- Project ref: `dzdgfbmwwzwfbycerimn`, in the Kei organisation
- Region: us-east-2
- Migrations: applied by the Supabase GitHub integration on merge to `main`.
  Never pushed by hand.
- Tenancy column: `space_id`
- Data API grants: explicit in every migration from the first one
- Tables intentionally readable by `anon`: none
- Tables intentionally writable by `anon`: none
- Service role key: `src/lib/supabase/admin.ts`, only to write `places`, which
  is shared across spaces and must hold only data fetched from OpenStreetMap;
  and `scripts/import-google-list.mts`, run by hand
- Storage buckets: none yet
- Auth: email one-time code; the Magic Link template sends `{{ .Token }}` (see
  `supabase/templates/sign-in-code.html`); new sign-ups are off; accounts are
  created by hand, and a second person joins a space through `space_invites`
- Point in time recovery enabled: no. Last tested restore: never

## Vercel

- Function region: Vercel's default (Washington, iad1), next to us-east-2
- Routes with a raised `maxDuration`: none
- Deployment protection on previews: Vercel default
- Cron jobs: none
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
  `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` (config, public by design) for production
  and preview; `SUPABASE_SECRET_KEY` (sensitive) for production only, so a
  preview can browse but cannot add places

## Cloudflare

- Not used.

## Cost surfaces

| Thing | Cost per unit | Limit in place |
|---|---|---|
| Supabase project | monthly compute on the Kei plan | one project |
| Mapbox map loads | free tier, then per 1,000 loads | token restricted to our URLs |
| Photon search | free public service, fair use | debounced in the browser |
| Email sends | Supabase built-in mail, rate limited | Supabase OTP limits |

## The public surface

| Route or action | Marker | Why public | Rate limited |
|---|---|---|---|
| `/sign-in` and `sendCode` / `verifyCode` | `@public-action` | signing in comes before a session | Supabase auth limits |
