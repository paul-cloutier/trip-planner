---
version: 1
slug: "src-app-pool-view-tsx"
primary_target: "src/app/pool-view.tsx"
related_targets: ["src/app/page.tsx"]
---

## Scope and mode

The pool view (`/`), phone and laptop. Operate. Code-led.

## Audience and job

Two travellers. Phone on the street (near me, today, one-handed, sun, roaming data); laptop months ahead (long research sitting over a city). Rows lead with place facts: category and distance. Our layer (via, why, who) shows once a place is open.

## Layout

- Phone: full-screen map; a sheet with three detents (peek, half, full) holding search, city switcher, filter chips and the list; a selected place opens in the same sheet.
- Laptop: ~400px list column on the left, map fills the rest; row hover highlights its pin; the place opens in the left column.
- Keep the data shape, server actions and every current feature: categories, want/been, via and why, add to trip, move pin.

## States

Empty pool, no filter matches (one tap to clear), no Mapbox token (list still works), location asking/refused/unavailable (no distance, sort by recent), slow and failed saves (roll back), long names, 1 to 500 saves with ~200 in one city.

## Open decisions

Open now needs opening hours, a data source and a schema change. Paste-a-link capture is product step 4, not this surface.

## Direction contract

THESIS: The pool is a native maps app that happens to be ours. It refuses a branded world; Apple Maps is the bar and conventions are kept on purpose.
OWN-WORLD: System sans (SF on Apple devices), light map with dark-mode tokens, grouped-background greys, one system blue for selection and controls, category dots as the only other colour, hairline separators, a detented sheet with a grabber, segmented control for want/been.
STORY: Open the app, see your places on the map and the nearest few in the sheet; tap one to see why you saved it; mark it been; move on.
FIRST VIEWPORT: Phone: map edge to edge; sheet at half height with the space name as a large title, a filled search field under it, a city button and filter chips, then rows of dot, name, category line, right-aligned distance. Laptop: same column at 400px on the left, full-height map right.
FORM: The category standard (canon), chosen by the user over the roll. seed:d70f703387a55d0f
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
