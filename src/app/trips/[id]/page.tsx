import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { requireSpace } from "@/lib/space";

import type { Category } from "../../pool-types";
import TripView, { type TripItem, type TripLeg } from "./trip-view";

// A trip of 213 places is our biggest; this leaves room without being unbounded.
const ITEM_LIMIT = 1000;

export default async function TripPage({ params }: PageProps<"/trips/[id]">) {
  const parsed = z.uuid().safeParse((await params).id);
  if (!parsed.success) notFound();
  const tripId = parsed.data;

  const { supabase, spaceId } = await requireSpace();
  if (!spaceId) notFound();

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id, name")
    .eq("id", tripId)
    .eq("space_id", spaceId)
    .maybeSingle();
  if (tripError) throw new Error("Could not load trip");
  if (!trip) notFound();

  const [{ data: legs, error: legsError }, { data: items, error: itemsError }] = await Promise.all([
    supabase
      .from("trip_legs")
      .select("id, city, starts_on, ends_on, position")
      .eq("trip_id", tripId)
      .eq("space_id", spaceId)
      .order("starts_on", { ascending: true, nullsFirst: false })
      .order("position")
      .limit(50),
    supabase
      .from("trip_items")
      .select("id, day, save:saves(category, pin_lat, pin_lng, place:places(name, city, lat, lng))")
      .eq("trip_id", tripId)
      .eq("space_id", spaceId)
      .order("position")
      .limit(ITEM_LIMIT),
  ]);
  if (legsError || itemsError) throw new Error("Could not load trip");

  // Pick exactly what the screen needs.
  const tripLegs: TripLeg[] = legs.map((l) => ({
    id: l.id,
    city: l.city,
    startsOn: l.starts_on,
    endsOn: l.ends_on,
  }));
  const tripItems: TripItem[] = items.flatMap((i) =>
    i.save?.place
      ? [
          {
            id: i.id,
            day: i.day,
            name: i.save.place.name,
            city: i.save.place.city,
            category: i.save.category as Category | null,
            lat: i.save.pin_lat ?? i.save.place.lat,
            lng: i.save.pin_lng ?? i.save.place.lng,
          },
        ]
      : [],
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-3">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{trip.name}</h1>
        <Link href="/trips" className="shrink-0 text-sm underline">
          All trips
        </Link>
      </header>
      <TripView
        tripId={trip.id}
        legs={tripLegs}
        items={tripItems}
        mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? null}
      />
    </main>
  );
}
