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
- **Our own map: Mapbox.** Places are ours: we set their category and can
  move their pin. Google is a source we imported from once, not a dependency.
- **No sync back to Google Maps.** Our map is the map. Import from Google is
  one-way and one-time.
- **Import comes first.** We have a lot in Google lists already (one list,
  "Italy France UK trip", alone has 213 places). Starting from an empty map
  would kill trust in the app.
- **Categories:** a small fixed set for pin colour and filtering (Eat, Coffee,
  Drink, Shop, Records, Books, See, Stay) plus free tags for taste (natural
  wine, WWII history). Records and books are constants for us, so they get
  categories of their own; Do was dropped (theatres and the like are See). Google's category ("Record store", "Bakery") seeds both.
- **Private stays private.** Our why, via and who-added never appear in a
  shared guide unless written as the public blurb.

## The import

Scripts, not a feature. Google Takeout did not include our lists, so each
list is captured from its shared link with `scripts/capture-google-list.mts`
into `imports/` (git ignored) and loaded with `scripts/import-google-list.mts`
(Node 22; against production it needs the hosted secret key). The capture carries
coordinates, Google's cid, our note, when it was added and who added it.

- Notes split into via and why ("Danielle- great steak frites"). A lone "A" is
  Alana signing her note and is dropped.
- City from the address, else the nearest place with a city (Mapbox reverse
  geocoding when a token is set). Category is a keyword guess; the rest land
  unsorted for us to sort by hand.
- Italy France UK trip and Japan are in. The scripts stay for as long as we
  keep bringing Google lists across.

## Moving

- **Who added what in a shared Google list.** The shared list shows an "A"
  against some places. It may be a note or the initial of whoever added it.
  A real Takeout CSV will tell us.
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
