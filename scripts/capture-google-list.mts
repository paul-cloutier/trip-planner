// Captures a shared Google Maps list from its link into imports/<name>.json,
// the file import-google-list.mts reads. Run by hand, locally.
//
//   npx tsx scripts/capture-google-list.mts https://maps.app.goo.gl/DqY7JRJpZtCm9U3a8
//
// The shared list is public, so no login is needed. Google has no API for
// this: the list page loads its places from an internal "getlist" call whose
// answer is positional arrays, and this reads that same call. If Google
// changes the shape, the zod parse below fails loudly rather than importing
// junk.

import { mkdirSync, writeFileSync } from "node:fs";
import { z } from "zod";

const input = process.argv[2];
if (!input) throw new Error("usage: capture-google-list.mts <shared list link>");

const ALLOWED_HOSTS = new Set(["maps.app.goo.gl", "goo.gl", "www.google.com", "google.com"]);

function assertGoogle(url: URL) {
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) {
    throw new Error(`Not a Google Maps link: ${url.hostname}`);
  }
}

// --- list id ----------------------------------------------------------------

async function listIdFrom(link: string) {
  let url = new URL(link);
  assertGoogle(url);
  // A short link redirects to a long one that carries the id.
  for (let hop = 0; hop < 5 && url.hostname.endsWith("goo.gl"); hop++) {
    const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(10_000) });
    const next = res.headers.get("location");
    if (!next) throw new Error(`Short link did not redirect (${res.status})`);
    url = new URL(next, url);
    assertGoogle(url);
  }
  const id = /!2s([\w-]{10,40})/.exec(url.href)?.[1] ?? /placelists\/list\/([\w-]{10,40})/.exec(url.href)?.[1];
  if (!id) throw new Error("No list id in that link. Is it a shared list link?");
  return id;
}

// --- fetch and parse --------------------------------------------------------

const PAGE_SIZE = 500;

// Positional arrays in, named fields out. Indexes found by reading a real
// response; each is parsed so a shift in Google's layout is an error.
const tupleHead = <T extends z.ZodType>(first: T) => z.tuple([first]).rest(z.unknown());

// z.preprocess turns the positional array into named fields; the inner schema
// then validates them.
const positions = (pick: (r: unknown[]) => Record<string, unknown>) => (value: unknown) =>
  Array.isArray(value) ? pick(value) : value;

const entity = z.preprocess(
  positions((e) => ({ address: e[4], coords: e[5], cid: e[6] })),
  z.object({
    address: z.string().nullish().transform((v) => v ?? null),
    coords: z.tuple([z.unknown(), z.unknown(), z.number(), z.number()]).rest(z.unknown()),
    cid: z.tuple([z.string(), z.string()]),
  }),
);

const row = z.preprocess(
  positions((r) => ({ entity: r[1], name: r[2], note: r[3], created: r[9], by: r[12] })),
  z.object({
    entity,
    name: z.string().min(1),
    note: z.string().nullish().transform((v) => v ?? ""),
    created: tupleHead(z.number()),
    by: tupleHead(z.string()),
  }),
);

const response = z.preprocess(
  (value) => {
    const list = Array.isArray(value) ? value[0] : undefined;
    return Array.isArray(list) ? { title: list[4], rows: list[8] } : value;
  },
  z.object({ title: z.string().min(1), rows: z.array(row).max(2000) }),
);

// Google writes Japanese-style addresses country first; the importer expects
// the country last.
function countryLast(address: string | null) {
  if (!address) return null;
  const parts = address.split(",").map((s) => s.trim());
  if (parts[0] !== parts[parts.length - 1] && /^(Japan|日本)$/.test(parts[0])) {
    return [...parts.slice(1).reverse(), parts[0]].join(", ");
  }
  return address;
}

const id = await listIdFrom(input);
const pb = `!1m4!1s${id}!2e1!3m1!1e1!2e2!3e2!4i${PAGE_SIZE}!15i204459!28e2!16b1`;
const api = new URL("https://www.google.com/maps/preview/entitylist/getlist");
api.search = new URLSearchParams({ authuser: "0", hl: "en", gl: "us", pb }).toString();

const res = await fetch(api, {
  headers: { "user-agent": "Mozilla/5.0" },
  signal: AbortSignal.timeout(20_000),
});
if (!res.ok) throw new Error(`Google answered ${res.status}. Is the list shared by link?`);
const text = (await res.text()).replace(/^\)\]\}'\n?/, "");
const parsed = response.parse(JSON.parse(text));

if (parsed.rows.length >= PAGE_SIZE) {
  console.warn(`Got ${parsed.rows.length} places, the page size. The list may be longer; paging is not built.`);
}

// --- write ------------------------------------------------------------------

const places = parsed.rows.map((r) => ({
  name: r.name,
  note: r.note,
  address: countryLast(r.entity.address),
  lat: r.entity.coords[2],
  lng: r.entity.coords[3],
  cid: r.entity.cid,
  kg: null,
  added_at: new Date(r.created[0] * 1000).toISOString(),
  added_by: r.by[0],
}));

const slug = parsed.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "list";
mkdirSync("imports", { recursive: true });
const out = `imports/${slug}.json`;
writeFileSync(out, JSON.stringify({ list: parsed.title, places }, null, 1));

const adders = Object.entries(
  places.reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.added_by]: (acc[p.added_by] ?? 0) + 1 }), {}),
);
console.log(`Captured "${parsed.title}": ${places.length} places -> ${out}`);
console.log(`Added by: ${adders.map(([n, c]) => `${n} ${c}`).join(", ")}`);
