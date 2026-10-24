# Repair queue

Things noticed in passing that are worth fixing but not worth interrupting the
current thread for. Agents append here instead of doing drive-by refactors.

| Date | Where | What | Size |
|---|---|---|---|
| 2026-10-23 | `src/app/layout.tsx` | Geist Sans is still loaded but `--font-sans` now uses the system stack, so it is dead weight. Drop the import (keep Geist Mono only if something uses it). | S |
| 2026-10-23 | `src/app/page.tsx` `Shell`, `src/app/sign-in`, `src/app/trips` | Still on the old neutral Tailwind look; move them onto the DESIGN.md tokens when those screens are next touched. | M |
| 2026-10-23 | `src/app/pool-map.tsx` | The accent blue is typed twice (CSS token and map paint). Fine for now; if a third copy appears, read it from the CSS variable. | S |
| 2026-10-23 | `src/app/search-actions.ts` `addPlace` | The `places` upsert updates `city`/`country` on conflict, so a second space adding the same OSM place rewrites the city the first space sees. Harmless with one space; before a second real space exists, move city onto the save or stop updating on conflict. | M |
