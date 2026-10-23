"use server";
// Signed-in members only (requireSpace). Search goes to Photon; adding a place
// re-fetches it from Photon rather than trusting what the browser sends.

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { searchOsm, type OsmPlace } from "@/lib/photon";
import { requireSpace } from "@/lib/space";
import { createAdminClient } from "@/lib/supabase/admin";

import type { PoolSave } from "./pool-types";

const near = z
  .object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  })
  .strict();

const searchSchema = z
  .object({ query: z.string().trim().min(2).max(100), near: near.optional() })
  .strict();

export async function searchPlaces(input: z.input<typeof searchSchema>) {
  const { spaceId } = await requireSpace();
  const parsed = searchSchema.safeParse(input);
  if (!spaceId || !parsed.success) return { ok: false as const };
  try {
    const results = await searchOsm(parsed.data.query, parsed.data.near);
    return { ok: true as const, results };
  } catch (e) {
    console.error("searchPlaces failed", e instanceof Error ? e.message : e);
    return { ok: false as const };
  }
}

const addSchema = z
  .object({
    osmType: z.enum(["N", "W", "R"]),
    osmId: z.number().int().positive(),
    query: z.string().trim().min(2).max(100),
    near: near.optional(),
  })
  .strict();

// Same-city snapping: a new place within this distance of one we already have
// takes that place's city, so "Paris 11e" and "Paris" stay one city.
const SNAP_KM = 25;

export async function addPlace(
  input: z.input<typeof addSchema>,
): Promise<{ ok: true; save: PoolSave; existed: boolean } | { ok: false }> {
  const { supabase, user, spaceId } = await requireSpace();
  const parsed = addSchema.safeParse(input);
  if (!spaceId || !parsed.success) return { ok: false };
  const { osmType, osmId, query } = parsed.data;

  // The place's facts come from Photon, never from the request body.
  let osm: OsmPlace | undefined;
  try {
    osm = (await searchOsm(query, parsed.data.near)).find(
      (r) => r.osmType === osmType && r.osmId === osmId,
    );
  } catch (e) {
    console.error("addPlace lookup failed", e instanceof Error ? e.message : e);
  }
  if (!osm) return { ok: false };

  const { data: known, error: knownError } = await supabase
    .from("saves")
    .select("id, place:places(id, name, city, country, lat, lng)")
    .eq("space_id", spaceId)
    .limit(1000);
  if (knownError) return { ok: false };
  // The same spot saved before from another source (Google, by hand)? Then it
  // is that place: within 75 m and one name starts with the other.
  const simple = (n: string) =>
    n
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim();
  const twin = known.find(
    (k) =>
      k.place &&
      km(osm, k.place) < 0.075 &&
      (simple(k.place.name).startsWith(simple(osm.name)) ||
        simple(osm.name).startsWith(simple(k.place.name))),
  );

  const nearest = known
    .flatMap((k) => (k.place?.city ? [k.place] : []))
    .map((p) => ({ ...p, km: km(osm, p) }))
    .sort((a, b) => a.km - b.km)[0];
  const city = nearest && nearest.km < SNAP_KM ? nearest.city : osm.city;
  const country =
    nearest && nearest.km < SNAP_KM ? nearest.country : osm.country;

  const admin = createAdminClient();
  const { data: place, error: placeError } = twin?.place
    ? { data: twin.place, error: null }
    : await admin
        .from("places")
        .upsert(
          {
            osm_type: osm.osmType,
            osm_id: osm.osmId,
            osm_tag: osm.tag,
            name: osm.name,
            lat: osm.lat,
            lng: osm.lng,
            address: osm.address,
            city,
            country,
          },
          { onConflict: "osm_type,osm_id" },
        )
        .select("id, name, city, lat, lng")
        .single();
  if (placeError) {
    console.error("addPlace place upsert failed", placeError.code);
    return { ok: false };
  }

  // The save is written as the user, so RLS applies.
  // Already saved? Leave it as it is; the upsert then returns no row.
  const { data: inserted, error: saveError } = await supabase
    .from("saves")
    .upsert(
      {
        space_id: spaceId,
        place_id: place.id,
        added_by: user.id,
        category: osm.category,
      },
      { onConflict: "space_id,place_id", ignoreDuplicates: true },
    )
    .select("id");
  if (saveError) {
    console.error("addPlace save failed", saveError.code);
    return { ok: false };
  }

  const { data: save, error: readError } = await supabase
    .from("saves")
    .select(
      "id, via, why, category, status, added_by, pin_lat, pin_lng, trip_items(trip_id)",
    )
    .eq("space_id", spaceId)
    .eq("place_id", place.id)
    .single();
  if (readError) return { ok: false };
  const { data: member } = await supabase
    .from("space_members")
    .select("display_name")
    .eq("space_id", spaceId)
    .eq("user_id", save.added_by ?? user.id)
    .maybeSingle();

  revalidatePath("/");
  return {
    ok: true,
    existed: inserted.length === 0,
    save: {
      id: save.id,
      name: place.name,
      city: place.city,
      category: save.category as PoolSave["category"],
      status: save.status as PoolSave["status"],
      via: save.via,
      why: save.why,
      addedBy: member?.display_name ?? "someone",
      lat: save.pin_lat ?? place.lat,
      lng: save.pin_lng ?? place.lng,
      moved: save.pin_lat !== null,
      tripIds: save.trip_items.map((t) => t.trip_id),
    },
  };
}

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = Math.PI / 180;
  const x = (b.lng - a.lng) * r * Math.cos(((a.lat + b.lat) / 2) * r);
  const y = (b.lat - a.lat) * r;
  return Math.sqrt(x * x + y * y) * 6371;
}
