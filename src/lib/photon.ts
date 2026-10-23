import "server-only";

import { z } from "zod";

import type { Category } from "@/app/pool-types";

// Photon (komoot) searches OpenStreetMap by name and is built for search as
// you type. The host is fixed here; nothing user-supplied becomes a URL.
// OSM data is ODbL: we may keep it, and we credit OpenStreetMap where it shows.
const PHOTON = "https://photon.komoot.io/api/";

const feature = z.object({
  geometry: z.object({ coordinates: z.tuple([z.number(), z.number()]) }),
  properties: z.object({
    osm_type: z.enum(["N", "W", "R"]),
    osm_id: z.number().int(),
    osm_key: z.string().optional(),
    osm_value: z.string().optional(),
    name: z.string().optional(),
    housenumber: z.string().optional(),
    street: z.string().optional(),
    district: z.string().optional(),
    locality: z.string().optional(),
    city: z.string().optional(),
    county: z.string().optional(),
    country: z.string().optional(),
    postcode: z.string().optional(),
  }),
});
const response = z.object({ features: z.array(z.unknown()) });

export type OsmPlace = {
  osmType: "N" | "W" | "R";
  osmId: number;
  name: string;
  lat: number;
  lng: number;
  address: string | null;
  city: string | null;
  country: string | null;
  tag: string | null;
  category: Category | null;
};

function toPlace(raw: unknown): OsmPlace | null {
  const parsed = feature.safeParse(raw);
  if (!parsed.success || !parsed.data.properties.name) return null;
  const p = parsed.data.properties;
  const [lng, lat] = parsed.data.geometry.coordinates;
  const street = [p.street, p.housenumber].filter(Boolean).join(" ");
  return {
    osmType: p.osm_type,
    osmId: p.osm_id,
    name: p.name ?? "",
    lat,
    lng,
    address: [street, p.postcode, p.city ?? p.locality].filter(Boolean).join(", ") || null,
    // London's boroughs report themselves as the city; we want "London".
    city: p.county === "Greater London" ? "London" : (p.city ?? p.locality ?? p.county ?? null),
    country: p.country ?? null,
    tag: p.osm_key && p.osm_value ? `${p.osm_key}=${p.osm_value}` : null,
    category: categoryFor(p.osm_key, p.osm_value),
  };
}

export async function searchOsm(query: string, near?: { lat: number; lng: number }) {
  const url = new URL(PHOTON);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "8");
  url.searchParams.set("lang", "en");
  if (near) {
    url.searchParams.set("lat", near.lat.toFixed(4));
    url.searchParams.set("lon", near.lng.toFixed(4));
  }
  const res = await fetch(url, {
    signal: AbortSignal.timeout(5000),
    headers: { "User-Agent": "trips (personal place list)" },
  });
  if (!res.ok) throw new Error(`Photon ${res.status}`);
  const body = response.parse(await res.json());
  return body.features.flatMap((f) => toPlace(f) ?? []);
}

// OSM tags onto our categories. A guess: anything it misses lands unsorted.
function categoryFor(key?: string, value?: string): Category | null {
  if (!key || !value) return null;
  if (key === "amenity") {
    if (value === "cafe") return "coffee";
    if (["restaurant", "fast_food", "ice_cream", "food_court"].includes(value)) return "eat";
    if (["bar", "pub", "biergarten", "nightclub"].includes(value)) return "drink";
    if (["theatre", "cinema", "arts_centre"].includes(value)) return "do";
    if (value === "place_of_worship") return "see";
    return null;
  }
  if (key === "shop") {
    if (value === "coffee") return "coffee";
    if (["bakery", "pastry", "confectionery", "deli", "cheese"].includes(value)) return "eat";
    return "shop";
  }
  if (key === "tourism") {
    if (["hotel", "hostel", "guest_house", "apartment", "motel"].includes(value)) return "stay";
    if (["museum", "gallery", "attraction", "artwork", "viewpoint"].includes(value)) return "see";
    return null;
  }
  if (key === "historic") return "see";
  if (key === "leisure" && ["park", "garden"].includes(value)) return "see";
  return null;
}
