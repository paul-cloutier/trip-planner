# Per-project harness settings. This file is yours; sync never overwrites it.
# Everything is optional.

# Supabase features (the Supabase Cursor rule, the RLS audit) switch on when
# the project depends on @supabase/* or has a supabase/ folder. Override: on | off
# HARNESS_SUPABASE=auto

# Which coding agents get rules, commands and the end-of-turn hook. Both by
# default; sync removes what it wrote for an agent you take out.
# HARNESS_AGENTS="cursor claude"

# Branch on which spike markers are rejected.
# HARNESS_DEFAULT_BRANCH=main

# Days before a dated SPIKE() starts nagging.
# HARNESS_SPIKE_MAX_DAYS=30

# Skip specific checks in this project, space separated. "turn" switches off
# the end-of-turn check and removes its hook entries on the next sync.
# HARNESS_DISABLE="getsession cache-review"

# When pre-push finds the LOCAL database behind your migration files, report it
# (default) or apply them with 'supabase migration up'. Never touches any
# database other than the local stack.
# HARNESS_MIGRATE_LOCAL=report

# Semgrep rules to silence in this project, by short id, space separated.
# HARNESS_SEMGREP_EXCLUDE="missing-timeout-on-outbound-fetch"

# In CI, a Supabase project with no SUPABASE_DB_URL secret FAILS the database
# job rather than passing while auditing nothing. Set 0 to opt out on purpose.
# HARNESS_REQUIRE_DB_AUDIT=1

# A site with no user accounts at all (marketing, docs, a portfolio) has no
# identity to check. Mark each route or action // @public-route with a reason,
# or turn the checks off for the whole project:
# HARNESS_DISABLE="route-handlers server-actions"

# Every Next.js app without Sentry or Speed Insights is flagged (never blocked).
# Leave out apps that deliberately have neither, as dirs, space separated, or
# turn the flag off with HARNESS_DISABLE="observability".
# HARNESS_OBSERVABILITY_SKIP="apps/internal-tool"

# Extra names that count as "this handler establishes identity", as a regex
# alternation. The default already accepts requireUser, requireAuth, getUser,
# getCurrentUser, authorize and verifyWebhook. Add your auth library's here.
# HARNESS_AUTH_PATTERN='auth\(|getServerSession|currentUser'


# Extra ratchet metrics, one "label|regex" per line. Use this instead of
# forking when a mistake is specific to this codebase.
# HARNESS_EXTRA_METRICS='legacy-api|from-old-api
# inline-styles|style=\{\{'
