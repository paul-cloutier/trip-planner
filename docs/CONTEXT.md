# Context

What we are making, why, and the words we use for its parts. A map of intent,
not a spec. Sections marked **Settled** are ground to build on; **Moving** means
it may still shift.

## What it is

A shared place-keeper for two people who travel together and research a lot
before they go: restaurants, coffee, bars, record stores, history, oddities.
One pool of places we both add to, organised by itself, that we can turn into
trips with days and into guides we share with friends.

It replaces Google Maps saved lists, which we use today and which fail us:
no categories, no days, no itinerary, no way to share "best of Paris" without
sharing a whole multi-city trip, and no record of who added a place or why.

## Who it is for

Us: two people, both on iPhone. Possibly friends later as read-only viewers of
a shared guide. Not a public product, not a social network.

## Vocabulary

- **Place**: the real-world spot. Name, coordinates, Google category, hours,
  photo. Fetched from Google Places by place ID, never typed by hand. One row
  per real place, shared by everything that refers to it.
- **Save**: our layer on a place, and the thing we actually care about.
  - who added it, and when
  - **via**: who or what recommended it (a person, an article, an Instagram
    post, Claude, one of us)
  - **why**: one line, optional ("great steak frites")
  - source link
  - our own photos
  - category plus free tags
  - status: **want** or **been** (with date, and "would go back")
- **Pool**: every save in our shared space. Grouped by city automatically
  from coordinates; nobody files anything.
- **Collection**: a hand-picked subset of the pool ("Best of Paris"). The unit
  we share.
- **Trip**: a date range across one or more cities, broken into **days**. Days
  are buckets with optional times, filled by dragging from the pool. Each trip
  has a **maybe shelf** for places pulled in but not yet placed on a day.
- **Guide**: a collection published as a read-only link, with a public blurb
  per place that is separate from our private why.

## Settled

- **One pool, many views.** A place can be in the pool, a collection and a
  trip day at once. Lists are views over saves, never containers that own them.
- **Capture must be near-instant.** If saving is slower than the star in
  Google Maps we will stop using it.
- **iPhone, web first.** A web app added to the home screen, plus an iOS
  Shortcut in the share sheet that posts a link to the app. No native app
  until the web app hits a wall.
- **No sync back to Google Maps.** Our map is the map. Import from Google is
  one-way and one-time.
- **Import comes first.** We have a lot in Google lists already (one list,
  "Italy France UK trip", alone has 213 places). Starting from an empty map
  would kill trust in the app.
- **Categories:** a small fixed set for pin colour and filtering (Eat, Coffee,
  Drink, Shop, See, Do, Stay) plus free tags for taste (records, natural wine,
  WWII history). Google's category ("Record store", "Bakery") seeds both.
- **Private stays private.** Our why, via and who-added never appear in a
  shared guide unless written as the public blurb.

## The import

Source is Google Takeout (Saved): one CSV per list with title, note, comment
and a Google Maps URL. No coordinates, no place ID. Scraping shared list pages
is out: against Google's terms and brittle.

- Each of us imports our own Takeout; saves are credited to whoever's file they
  came from. A place both of us saved merges into one place with both notes.
- Each URL is resolved to a place through the Places API (costs a little per
  place; a few hundred places is pennies to a few dollars).
- Our existing notes are mostly a person's name, sometimes with a reason:
  "Danielle", "janelle- best seafood", "It's a very thin house". The importer
  splits "Name- reason" into via and why, and leaves the rest as why.
- A review screen sorts results into matched, unsure and failed, so the
  unsure ones get fixed by hand once.
- An imported list lands as a draft trip with its places on the maybe shelf,
  and its places join the pool split by city.

## Moving

- **Who added what in a shared Google list.** The shared list shows an "A"
  against some places. It may be a note or the initial of whoever added it.
  A real Takeout CSV will tell us.
- **Map provider.** Leaning Mapbox or MapLibre (cheaper, easier to style than
  Google's map); Google Places only for matching and enrichment.
- **Guide design.** We want it to look good, but it is not first. The model
  already supports it.
- **Auto-marking been** from photo locations. Nice later, not now.
- **Itinerary depth.** Days as buckets is the starting point; whether we want
  times, travel between places, or neighbourhood clustering is open.

## Order we expect to build in

1. Shared space for the two of us: two logins, one pool.
2. Import: upload Takeout CSVs, match, review, land in the pool.
3. Pool view: map and list, filtered by city, category, want/been, who added.
4. Save from a link, in the app first, then the iOS Shortcut.
5. Trips with days.
6. Collections and shareable guides.

After step 3 we can judge, on real data, whether it beats Google Maps.

## Stack (leaning, not yet set up)

Next.js on Vercel, Supabase for auth, database and photo storage, as in our
other projects. A new Supabase project, not the shared RACEUSA one.

To decide before code: Google Places API key, map provider, domain the
Shortcut posts to.

## References

- Google Maps saved lists: the thing we are replacing. Example: the shared
  list "Italy France UK trip".
- Google Takeout (Saved): the import source.
