// One-off import of a Google Maps list captured from its shared link into
// imports/<name>.json. Not part of the app: run by hand, locally, once per list.
//
//   npx tsx --env-file=.env.local scripts/import-google-list.mts \
//     imports/italy-france-uk-trip.json \
//     --member "Paul Cloutier=paul@example.com" \
//     --member "Alana Cloutier=alana@example.com" \
//     --trip
//
// Each --member maps the name Google shows for whoever added a place to the
// email of their account here. Both accounts must be in the same space.
// Safe to re-run: places upsert on Google's cid, saves on (space, place).
//
// --trip also makes a draft trip named after the list: every place on its
// maybe shelf, and an undated leg for each city with five or more places.
// Re-running leaves anything already planned onto a day where it is.
//
// City comes from Mapbox reverse geocoding when NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
// is set. Without it, from the address where there is one, and otherwise from
// the nearest place that does have a city. Category is a guess from the name
// and note; anything it cannot place is left unsorted for us to sort.

import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "../src/lib/database.types";

const env = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    SUPABASE_SECRET_KEY: z.string().min(1),
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: z.string().min(1).optional(),
  })
  .parse(process.env);

const capture = z.object({
  list: z.string(),
  places: z
    .array(
      z.object({
        name: z.string().min(1),
        note: z.string(),
        address: z.string().nullable(),
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        cid: z.tuple([z.string(), z.string()]),
        added_at: z.iso.datetime(),
        added_by: z.string(),
      }),
    )
    .max(2000),
});

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    member: { type: "string", multiple: true, default: [] },
    trip: { type: "boolean", default: false },
  },
});
const file = positionals[0];
if (!file) throw new Error("usage: import-google-list.mts <file.json> --member 'Name=email' ...");

const { list, places } = capture.parse(JSON.parse(readFileSync(file, "utf8")));
const supabase = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

// --- who added it -----------------------------------------------------------

const emailByName = new Map(
  values.member.map((m) => {
    const [name, email] = m.split("=");
    return [name.trim(), email.trim().toLowerCase()];
  }),
);

const { data: users, error: usersError } = await supabase.auth.admin.listUsers({ perPage: 100 });
if (usersError) throw usersError;

const userIdByName = new Map<string, string>();
for (const [name, email] of emailByName) {
  const user = users.users.find((u) => u.email?.toLowerCase() === email);
  if (!user) throw new Error(`No account for ${email}`);
  userIdByName.set(name, user.id);
}

const { data: memberships, error: membershipError } = await supabase
  .from("space_members")
  .select("space_id, user_id")
  .in("user_id", [...userIdByName.values()])
  .limit(20);
if (membershipError) throw membershipError;
const spaceIds = new Set(memberships.map((m) => m.space_id));
if (spaceIds.size !== 1 || memberships.length !== userIdByName.size) {
  throw new Error("Every --member must belong to exactly one, shared space");
}
const [spaceId] = spaceIds;

for (const p of places) {
  if (!userIdByName.has(p.added_by)) throw new Error(`No --member given for "${p.added_by}"`);
}

// --- via and why ------------------------------------------------------------

const SOURCES = ["Danielle", "Janelle", "Sam", "Rick Steves", "Monocle", "Michelin", "Claude"];

function splitNote(note: string, addedBy: string): { via: string | null; why: string | null } {
  let text = note.trim();
  // A bare initial is the adder signing the note; we already know who added it.
  if (/^[A-Z]$/.test(text) || text === addedBy.split(" ")[0][0]) return { via: null, why: null };

  const found = SOURCES.filter((s) => new RegExp(`\\b${s}\\b`, "i").test(text));
  for (const s of found) {
    text = text
      .replace(new RegExp(`\\b${s}\\b\\s*(says|recommendation|rec|guide)?\\s*[-:,]?\\s*`, "gi"), " ")
      .trim();
  }
  text = text.replace(/^[-,:\s]+|[-,:\s]+$/g, "").replace(/\s+\n/g, "\n").replace(/ {2,}/g, " ");
  return { via: found.length ? found.join(", ") : null, why: text || null };
}

// --- category ---------------------------------------------------------------

type Category = "eat" | "coffee" | "drink" | "shop" | "see" | "do" | "stay";

const RULES: [Category, RegExp][] = [
  ["stay", /\b(airbnb|hotel)\b/i],
  ["coffee", /\b(coffee|caffè|caffetteria|torrefazione|bong)\b/i],
  ["shop", /\b(records?|dischi|vinili|book(s|shop|store)?|librairie|libreria|graphic|watches|magculture|artwords|artazart|tampographe|bouquinistes|whisky|barman|spiritueux|bar tools|salumaio|peck)\b/i],
  ["drink", /\b(bar|bars|wine|cave|cantine|vinaietto|bierbar|pub|royal standard|camparino|liquiderie|apertivo)\b/i],
  ["eat", /\b(trattoria|osteria|hosteria|ristorante|restaurant|pizza|pizzeria|bistrot|pasticceria|boulangerie|gelat\w*|rosticceria|salumeria|tapas|michelin|steak|seafood|sandwich\w*|lunch|neve di latte|supplizio|ciacco|sugo|kubri|baratin|tagine|poulette|hood|lao siam|cornichon|pastamadre|marchesi|sant ambroeus|romanè|roscioli|pianostrada|sorpasso|olio|untitled|kalò|januarius|joca|sorbillo|essencia|luminist|toledo|bonvini|pavé|flavio|armando|ciambella|matarel|latteria|madonnina|panciroli|tina|notte|paradiso|sandì|masuelli|arena|giacomo|santa lucia|cendrillon|combat|parizot|french bastards|deux amis|petit grain|goncourt|utopie)\b/i],
  ["see", /\b(museum|museo|musée|church|chiesa|cathedral|cripta|fontana|fountain|piazza|p\.za|palazzo|palais|palace|galleria|gallery|temple|villa|foundation|fondazione|archivio|cemetery|bosco|square|campo|keyhole|sanctuary|pantheon|manor|house|park|village|bibury|appia|ostia|antiquarium|ercolano|presepi|funicolare|borbonica|mouth of truth|curia|triennale|pinacoteca|storehouse|bibliothèque|ateliers|duomo|bletchley|computing|loreto|meter|doll hospital|mercato|bingo|william morris|soane)\b/i],
];

function guessCategory(name: string, note: string): Category | null {
  const text = `${name} ${note}`;
  return RULES.find(([, re]) => re.test(text))?.[0] ?? null;
}

// --- city -------------------------------------------------------------------

const mapboxPlace = z.object({
  features: z.array(
    z.object({
      properties: z.object({
        name: z.string(),
        context: z.object({ country: z.object({ name: z.string() }).optional() }).optional(),
      }),
    }),
  ),
});

// A URL-restricted token refuses requests from a script; then stop asking and
// fall back to the address.
let mapboxRefused = false;

async function reverseGeocode(lat: number, lng: number) {
  if (!env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || mapboxRefused) return null;
  const url = new URL("https://api.mapbox.com/search/geocode/v6/reverse");
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("types", "place");
  url.searchParams.set("language", "en");
  url.searchParams.set("access_token", env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN);
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (res.status === 401 || res.status === 403) {
    mapboxRefused = true;
    console.warn(`Mapbox refused the token (${res.status}); using addresses for cities`);
    return null;
  }
  if (!res.ok) throw new Error(`Mapbox reverse geocode failed: ${res.status}`);
  const feature = mapboxPlace.parse(await res.json()).features[0];
  if (!feature) return null;
  return { city: feature.properties.name, country: feature.properties.context?.country?.name ?? null };
}

const CITY_NAMES: Record<string, string> = { Milano: "Milan", Roma: "Rome", Napoli: "Naples" };

function cityFromAddress(address: string | null) {
  const parts = address?.split(",").map((s) => s.trim()) ?? [];
  if (parts.length < 2) return null;
  const country = parts[parts.length - 1];
  const raw = parts[parts.length - 2]
    .replace(/^Metropolitan City of (\w+).*$/, "$1")
    .replace(/\b[A-Z0-9]{2,4} ?[0-9][A-Z]{2}\b/, "") // UK postcode
    .replace(/\b\d{4,5}\b/, "") // EU postcode
    .replace(/\b[A-Z]{2}$/, "") // Italian province
    .trim();
  const city = raw.split(" ").slice(-2).join(" ").replace(/^(South|North|East|West) /, "");
  if (!city) return null;
  return { city: CITY_NAMES[city] ?? city, country };
}

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = Math.PI / 180;
  const x = (b.lng - a.lng) * r * Math.cos(((a.lat + b.lat) / 2) * r);
  const y = (b.lat - a.lat) * r;
  return Math.sqrt(x * x + y * y) * 6371;
}

const located = [];
for (const p of places) {
  const where = (await reverseGeocode(p.lat, p.lng)) ?? cityFromAddress(p.address);
  located.push({ ...p, city: where?.city ?? null, country: where?.country ?? null });
}
for (const p of located) {
  if (p.city) continue;
  const near = located
    .filter((q) => q.city && q !== p)
    .sort((a, b) => km(p, a) - km(p, b))[0];
  if (near && km(p, near) < 30) Object.assign(p, { city: near.city, country: near.country });
}

// --- write ------------------------------------------------------------------

const { data: placeRows, error: placeError } = await supabase
  .from("places")
  .upsert(
    located.map((p) => ({
      google_cid: p.cid[1],
      name: p.name,
      lat: p.lat,
      lng: p.lng,
      address: p.address,
      city: p.city,
      country: p.country,
    })),
    { onConflict: "google_cid" },
  )
  .select("id, google_cid");
if (placeError) throw placeError;
const placeIdByCid = new Map(placeRows.map((r) => [r.google_cid, r.id]));

const saves = located.map((p) => {
  const { via, why } = splitNote(p.note, p.added_by);
  return {
    space_id: spaceId,
    place_id: placeIdByCid.get(p.cid[1])!,
    added_by: userIdByName.get(p.added_by)!,
    added_at: p.added_at,
    via,
    why,
    category: guessCategory(p.name, p.note),
  };
});

// Two Google entries can resolve to one place; keep the first.
const unique = [...new Map(saves.map((s) => [s.place_id, s])).values()];

const { data: saveRows, error: saveError } = await supabase
  .from("saves")
  .upsert(unique, { onConflict: "space_id,place_id" })
  .select("id");
if (saveError) throw saveError;

if (values.trip) {
  const { data: existing, error: findError } = await supabase
    .from("trips")
    .select("id")
    .eq("space_id", spaceId)
    .eq("name", list)
    .limit(1)
    .maybeSingle();
  if (findError) throw findError;

  let tripId = existing?.id;
  if (!tripId) {
    const { data: created, error: createError } = await supabase
      .from("trips")
      .insert({ space_id: spaceId, name: list, created_by: unique[0]?.added_by ?? null })
      .select("id")
      .single();
    if (createError) throw createError;
    tripId = created.id;

    const counts = new Map<string, number>();
    for (const p of located) if (p.city) counts.set(p.city, (counts.get(p.city) ?? 0) + 1);
    const legs = [...counts]
      .filter(([, n]) => n >= 5)
      .sort((a, b) => b[1] - a[1])
      .map(([city], position) => ({ trip_id: tripId as string, space_id: spaceId, city, position }));
    const { error: legError } = await supabase.from("trip_legs").insert(legs);
    if (legError) throw legError;
  }

  const { error: itemError } = await supabase.from("trip_items").upsert(
    saveRows.map((s) => ({ trip_id: tripId as string, space_id: spaceId, save_id: s.id })),
    { onConflict: "trip_id,save_id", ignoreDuplicates: true },
  );
  if (itemError) throw itemError;
  console.log(`Draft trip "${list}" holds ${saveRows.length} places`);
}

const byCity = Object.entries(
  located.reduce<Record<string, number>>((acc, p) => {
    const k = p.city ?? "(no city)";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {}),
).sort((a, b) => b[1] - a[1]);

console.log(`Imported "${list}": ${unique.length} saves`);
console.log(`Unsorted: ${unique.filter((s) => !s.category).length}`);
console.log(`With via: ${unique.filter((s) => s.via).length}`);
console.log("Cities:", byCity.map(([c, n]) => `${c} ${n}`).join(", "));
