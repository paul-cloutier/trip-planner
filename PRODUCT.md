# Product

<!-- impeccable:product-schema 1 -->

The full product map, vocabulary and settled decisions live in
[docs/CONTEXT.md](docs/CONTEXT.md). This file is the design-facing summary of
it; when the two disagree, CONTEXT.md wins and this file gets updated.

## Platform

web

A mobile web app added to the iPhone home screen, plus a desktop layout for
planning on a laptop. No native app until the web app hits a wall.

## Users

Two people who travel together and research heavily before they go. Both on
iPhone, both also plan on laptops in the months before a trip. Possibly friends
later, as read-only viewers of a shared guide. Not a public product, not a
social network.

## Product Purpose

One shared pool of places (restaurants, coffee, bars, record stores, history,
oddities) that both people add to, organised by itself, and that turns into
trips with days and into guides shared with friends. It replaces Google Maps
saved lists, which have no categories, no days, no itinerary, no way to share
one city without sharing a whole trip, and no record of who added a place or
why.

Success: after the pool view exists, on real imported data, it beats Google
Maps for the two of us.

## Positioning

A place-keeper built around *our* layer on a place, not the place itself: who
added it, who recommended it (via), one line of why, want or been. One pool,
many views: a save can be in the pool, a collection and a trip day at once.

## Operating Context

The phone and the laptop do different jobs, and each layout should be built for its own job rather than shrunk or stretched from the other.

**Phone (primary):**
- *Capture on the go.* Saving a place someone just mentioned, or a link from
  Instagram or an article, in seconds. If it is slower than the star in Google
  Maps, it will not get used. The iOS share-sheet Shortcut feeds this.
- *On the ground in a city.* Walking around: what is near me, what is on
  today's day, is it open now. Often one-handed, outdoors in bright light, on
  roaming or patchy data.

**Laptop (months before a trip):**
- *Map and list research.* A big map beside the pool, filtering by city,
  category, want/been and who added, adding many places in one sitting.
- *Building trip days.* Dragging from the pool and the maybe shelf onto days,
  seeing days side by side.

## Capabilities and Constraints

- Stack: Next.js on Vercel, Supabase (auth, database, photos), Mapbox for our
  own map.
- Vocabulary is fixed: Place, Save, Pool, Collection, Trip, Day, Maybe shelf,
  Guide, via, why, want, been. Use these words in the UI.
- Categories are a small fixed set used for pin colour and filtering: Eat,
  Coffee, Drink, Shop, See, Do, Stay. Free tags carry taste.
- Private stays private: why, via and who-added never appear in a shared guide
  unless written as the public blurb.
- Undecided: itinerary depth (times, travel between places, neighbourhood
  clustering), guide design, auto-marking been.

## Brand Commitments

"Trips" is a working name only.

The whole app takes the category standard on purpose: it should feel like a
native iPhone and Mac maps app, with Apple Maps as the craft bar. Conventions
are embraced, not reinvented; the care goes into the details. Chosen in the
pool view's direction round, 2026-10-23.

## Evidence on Hand

Real imported Google Maps lists (one list alone has 213 places), captured into
`imports/` (git-ignored) and loaded into the pool. Design against that real
data, not invented places.

## Product Principles

1. Capture beats completeness. Saving must be near-instant; sorting can come
   later.
2. Our layer is the point. Who, via, why and want/been are first-class, not
   metadata.
3. One pool, many views. Lists are views over saves, never containers that
   own them.
4. Phone for being there, laptop for planning. Each gets the layout its job
   needs.
5. Private by default. Anything shared is written for sharing.
