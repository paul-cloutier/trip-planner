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
// Safe to re-run: places upsert on Google's cid; saves already here are left
// exactly as we have edited them.
//
// --trip also makes a draft trip named after the list: every place on its
// maybe shelf, and an undated leg for each city with five or more places.
// Re-running leaves anything already planned onto a day where it is.
//
// --refresh applies newer guesses to saves already here, only where untouched:
// an empty category, a note still as Google had it. With --trip it also
// rebuilds the trip's undated legs from the current cities.
//
// City comes from the address where there is one, then from OpenStreetMap's
// reverse lookup (Photon) for places Google gave only coordinates, and
// finally from the nearest place that does have a city. Category is a guess from the name and
// note; anything it cannot place is left unsorted for us to sort.

import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "../src/lib/database.types";

const env = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    SUPABASE_SECRET_KEY: z.string().min(1),
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
    refresh: { type: "boolean", default: false },
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

const SOURCES = ["Danielle", "Janelle", "Sam", "Rick Steves", "Monocle", "Michelin", "Claude", "Eater", "Neil"];

function splitNote(note: string, addedBy: string): { via: string | null; why: string | null } {
  let text = note.trim();
  // A bare initial is the adder signing the note; we already know who added it.
  if (/^[A-Z]$/.test(text) || text === addedBy.split(" ")[0][0]) return { via: null, why: null };

  const found = SOURCES.filter((s) => new RegExp(`\\b${s}\\b`, "i").test(text));
  for (const s of found) {
    text = text
      .replace(new RegExp(`\\b${s}\\b(?:[’']s)?\\s*(says|recommendation|rec|rex|guide|list)?\\s*[-:,]?\\s*`, "gi"), " ")
      .trim();
  }
  text = text.replace(/^[-,:\s]+|[-,:\s]+$/g, "").replace(/\s+\n/g, "\n").replace(/ {2,}/g, " ");
  return { via: found.length ? found.join(", ") : null, why: text || null };
}

// --- category ---------------------------------------------------------------

type Category = "eat" | "coffee" | "drink" | "shop" | "records" | "books" | "see" | "stay";

const RULES: [Category, RegExp][] = [
  ["stay", /\b(airbnb|hotel)\b/i],
  ["stay", /\b(residence|lodging)\b/i],
  ["coffee", /\b(coffee|caffè|caffetteria|torrefazione|bong)\b/i],
  ["coffee", /\b(kissa|roasters)\b|\bcaf[eé]/i],
  ["records", /\b(records?|dischi|vinili|rough trade|honest jon's|sister ray|phonica)\b/i],
  ["records", /\b(dub store)\b|レコード/i],
  ["books", /\b(book(s|shop|store)?|librairie|libreria|bouquinistes|artwords)\b/i],
  ["books", /\b(booksellers?|twelvebooks|t-site)\b|\blibrer/i],
  ["shop", /\b(graphic|watches|magculture|artwords|artazart|tampographe|bouquinistes|whisky|barman|spiritueux|bar tools|salumaio|peck)\b/i],
  ["shop", /\b(camera|yodobashi|hard off|flea market|antiques|gashapon|muji|beams|kitte|general store|gu tenjin|tamiya|fire kids|d&department|jackroad|maison kitsun\w*)\b|酒販/i],
  ["shop", /\b(store|tienda|boutique)\b/i],
  ["shop", /\b(antiques?|mercantile|supply co\.?|boots|hattery|western wear|spice shop|plants?|shoppe|shop)\b/i],
  ["shop", /\b(trading post|trader joe'?s)\b/i],
  ["drink", /\b(bar|bars|wine|cave|cantine|vinaietto|bierbar|pub|royal standard|camparino|liquiderie|apertivo)\b/i],
  ["drink", /\b(bourbon)\b|酒場/i],
  ["drink", /\b(mezcal\w*|cantina|pulquer\w*|cervecer\w*|vinater\w*)\b/i],
  ["drink", /\b(liquors?|lounge|supper club|brewing|brewery|taproom|cocktails?)\b/i],
  ["drink", /\b(saloon|tavern)\b/i],
  ["eat", /\b(trattoria|osteria|hosteria|ristorante|restaurant|pizza|pizzeria|bistrot|pasticceria|boulangerie|gelat\w*|rosticceria|salumeria|tapas|michelin|steak|seafood|sandwich\w*|lunch|neve di latte|supplizio|ciacco|sugo|kubri|baratin|tagine|poulette|hood|lao siam|cornichon|pastamadre|marchesi|sant ambroeus|romanè|roscioli|pianostrada|sorpasso|olio|untitled|kalò|januarius|joca|sorbillo|essencia|luminist|toledo|bonvini|pavé|flavio|armando|ciambella|matarel|latteria|madonnina|panciroli|tina|notte|paradiso|sandì|masuelli|arena|giacomo|santa lucia|cendrillon|combat|parizot|french bastards|deux amis|petit grain|goncourt|utopie)\b/i],
  ["eat", /\b(sushi|ramen|gyoza|gyōza|tonkatsu|yakitori|tempura|curry|tacos?|taqueria|burger|bakery|izakaya|udon|ippudo|ichiran|teppen|kitchen|food stalls|yatai|sangourmand)\b|焼肉|食堂|料理|居酒屋|楽食/i],
  ["eat", /\b(taquer\w*|tacos?|quesadillas?|comal|comedor|restaurante|fonda|panader\w*|churrer\w*|cucurucho|helader\w*|pasteler\w*|tamales?|mariscos|cevicher\w*)\b/i],
  ["eat", /\b(delicatessen|cuisine|biscuit|waffle|burgers?|pho|b[uú]n|sicilian|biang|bbq|grill)\b/i],
  ["eat", /\b(shake shack|loaves|pastr(y|ies)|petit four)\b/i],
  ["see", /\b(museum|museo|musée|church|chiesa|cathedral|cripta|fontana|fountain|piazza|p\.za|palazzo|palais|palace|galleria|gallery|temple|villa|foundation|fondazione|archivio|cemetery|bosco|square|campo|keyhole|sanctuary|pantheon|manor|house|park|village|bibury|appia|ostia|antiquarium|ercolano|presepi|funicolare|borbonica|mouth of truth|curia|triennale|pinacoteca|storehouse|bibliothèque|ateliers|duomo|bletchley|computing|loreto|meter|doll hospital|mercato|bingo|william morris|soane)\b/i],
  ["see", /\b(shrine|yokocho|ginza|bamboo|pavilion|tower|sight|teamlab|market|shinbashi|cat street|memory lane|hall|ishibe|forest|zombie fish|acros|giant 3d cat|cat shelter)\b/i],
  ["see", /\b(plaza|parque|puente|callej[oó]n|kiosko|museo|templo|iglesia|catedral|palacio|mercado|fuente|biblioteca|barrag[aá]n|gilardi|university city)\b/i],
  ["see", /\b(botanical|gardens?|galleries|gallery)\b/i],
  ["see", /sculpture/i],
];

function guessCategory(name: string, note: string): Category | null {
  const text = `${name} ${note}`;
  return RULES.find(([, re]) => re.test(text))?.[0] ?? null;
}

// --- city -------------------------------------------------------------------

const CITY_NAMES: Record<string, string> = {
  Milano: "Milan",
  Roma: "Rome",
  Napoli: "Naples",
  CDMX: "Mexico City",
  "Ciudad de México": "Mexico City",
};

// Japanese addresses end "..., Shinjuku City, Tokyo 160-0021, Japan" or
// "..., Nakagyo Ward, Kyoto, 604-8042, Japan", sometimes with a leading 〒.
// These prefectures are the city we think in; elsewhere (Oita, Shizuoka) the
// town before the prefecture is (Beppu, Itō).
const JAPAN_CITY_PREFECTURES = new Set(["Tokyo", "Kyoto", "Osaka", "Fukuoka"]);

function cityFromJapanAddress(parts: string[]) {
  const cleaned = parts
    .slice(0, -1)
    .map((p) => p.replace(/〒/g, "").replace(/\b\d{3}-?\d{4}\b/g, "").trim())
    .filter(Boolean);
  const prefecture = cleaned[cleaned.length - 1];
  if (!prefecture) return null;
  const city = JAPAN_CITY_PREFECTURES.has(prefecture) ? prefecture : (cleaned[cleaned.length - 2] ?? prefecture);
  return { city, country: "Japan" };
}

function cityFromAddress(address: string | null) {
  const parts = address?.split(",").map((s) => s.trim()) ?? [];
  if (parts.length < 2) return null;
  const last = parts[parts.length - 1];
  // US addresses end "City, ST 73102" with no country.
  const country = /^[A-Z]{2}( \d{5})?$/.test(last) ? "United States" : last;
  if (country === "Japan") return cityFromJapanAddress(parts);
  const raw = parts[parts.length - 2]
    .replace(/^Metropolitan City of (\w+).*$/, "$1")
    .replace(/\b[A-Z0-9]{2,4} ?[0-9][A-Z]{2}\b/, "") // UK postcode
    .replace(/\b\d{4,5}\b/, "") // EU postcode
    .replace(/\b[A-Z]{2}$/, "") // Italian province
    .trim();
  const city = raw.split(" ").slice(-2).join(" ").replace(/^(South|North|East|West) /, "");
  // "Méx." is the state around Mexico City, not a city: leave it to the nearest place.
  if (!city || city === "Méx.") return null;
  return { city: CITY_NAMES[city] ?? city, country };
}

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = Math.PI / 180;
  const x = (b.lng - a.lng) * r * Math.cos(((a.lat + b.lat) / 2) * r);
  const y = (b.lat - a.lat) * r;
  return Math.sqrt(x * x + y * y) * 6371;
}

// --- city from OpenStreetMap ------------------------------------------------

// Photon (komoot) is the same OpenStreetMap service the app searches with. It
// is only asked about places Google gave no address for, one at a time and
// politely. If it fails we say so once and fall back to the nearest place.
const photonReverse = z.object({
  features: z.array(
    z.object({
      properties: z.object({
        city: z.string().optional(),
        locality: z.string().optional(),
        county: z.string().optional(),
        country: z.string().optional(),
      }),
    }),
  ),
});

let photonDown = false;

async function reverseOsm(lat: number, lng: number) {
  if (photonDown) return null;
  const url = new URL("https://photon.komoot.io/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("lang", "en");
  url.searchParams.set("limit", "1");
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": "trips (personal place list)" },
    });
    if (!res.ok) throw new Error(`Photon ${res.status}`);
    const p = photonReverse.parse(await res.json()).features[0]?.properties;
    await new Promise((resolve) => setTimeout(resolve, 300));
    const city = p?.city ?? p?.locality ?? p?.county;
    return city ? { city, country: p?.country ?? null } : null;
  } catch (e) {
    photonDown = true;
    console.warn(`OpenStreetMap lookup failed (${e instanceof Error ? e.message : e}); using nearest place for cities`);
    return null;
  }
}

const located = [];
for (const p of places) {
  const where = cityFromAddress(p.address) ?? (await reverseOsm(p.lat, p.lng));
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

// Existing saves are left alone: a re-run must never undo our edits.
const { error: saveError } = await supabase
  .from("saves")
  .upsert(unique, { onConflict: "space_id,place_id", ignoreDuplicates: true });
if (saveError) throw saveError;

// All of this space's saves, then the ones from this list (a long .in() list
// overflows the URL).
const { data: spaceSaves, error: saveRowsError } = await supabase
  .from("saves")
  .select("id, place_id, via, why, category")
  .eq("space_id", spaceId)
  .limit(10_000);
if (saveRowsError) throw saveRowsError;
const listPlaceIds = new Set(unique.map((s) => s.place_id));
const saveRows = spaceSaves.filter((s) => listPlaceIds.has(s.place_id));

// --refresh applies improved guesses to saves already here, but only where we
// have not touched them: a category still empty, and a note still exactly as
// Google had it.
if (values.refresh) {
  const noteByPlaceId = new Map(located.map((p) => [placeIdByCid.get(p.cid[1]), p.note.trim()]));
  const guessByPlaceId = new Map(unique.map((s) => [s.place_id, s]));
  let refreshed = 0;
  for (const row of saveRows) {
    const guess = guessByPlaceId.get(row.place_id);
    if (!guess) continue;
    const patch: { category?: Category; via?: string; why?: string | null } = {};
    if (!row.category && guess.category) patch.category = guess.category;
    const noteUntouched = !row.via && (row.why ?? "") === (noteByPlaceId.get(row.place_id) ?? "");
    if (noteUntouched && guess.via) Object.assign(patch, { via: guess.via, why: guess.why });
    if (!Object.keys(patch).length) continue;
    const { error: patchError } = await supabase
      .from("saves")
      .update(patch)
      .eq("id", row.id)
      .eq("space_id", spaceId);
    if (patchError) throw patchError;
    refreshed++;
  }
  console.log(`Refreshed ${refreshed} saves`);
}

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

  }

  // Legs come from the cities with five or more places. A new trip gets them;
  // --refresh rebuilds the undated ones (dated legs are planning, left alone).
  if (!existing?.id || values.refresh) {
    if (existing?.id) {
      const { error: clearError } = await supabase
        .from("trip_legs")
        .delete()
        .eq("trip_id", tripId as string)
        .eq("space_id", spaceId)
        .is("starts_on", null);
      if (clearError) throw clearError;
    }
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
