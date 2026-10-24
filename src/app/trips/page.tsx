import { cityImage } from "@/lib/city-image";
import { requireSpace } from "@/lib/space";

import { createTrip } from "./actions";
import { formatDay } from "./dates";
import TripStack, { type StackTrip } from "./trip-stack";

export default async function TripsPage() {
  const { supabase, spaceId } = await requireSpace();
  if (!spaceId) return <main className="px-4 py-6">You are not in a space yet.</main>;

  const { data: trips, error } = await supabase
    .from("trips")
    .select("id, name, trip_legs(city, starts_on, ends_on, position)")
    .eq("space_id", spaceId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Could not load trips");

  const cards: StackTrip[] = trips.map((trip) => {
    const legs = [...trip.trip_legs].sort((x, y) => x.position - y.position);
    const start = legs.flatMap((l) => (l.starts_on ? [l.starts_on] : [])).sort()[0];
    const end = legs
      .flatMap((l) => (l.ends_on ? [l.ends_on] : []))
      .sort()
      .at(-1);
    return {
      id: trip.id,
      name: trip.name,
      dates: start && end ? `${formatDay(start)} – ${formatDay(end)}` : null,
      cities: legs.map((l) => l.city),
      image: null,
    };
  });

  // One picture per distinct first city, fetched together.
  const firstCities = [...new Set(cards.flatMap((c) => c.cities.slice(0, 1)))];
  const images = new Map(
    await Promise.all(firstCities.map(async (city) => [city, await cityImage(city)] as const)),
  );
  for (const card of cards) card.image = images.get(card.cities[0] ?? "") ?? null;

  return (
    <div className="min-h-dvh bg-grouped">
      <main className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 pb-3 max-lg:pb-[var(--nav-inset)] lg:pt-16">
        <header className="sticky top-0 z-20 -mx-4 bg-grouped px-4 pt-3 pb-2 standalone:max-lg:pt-10 lg:top-[52px] lg:pt-0">
          <h1 className="text-xl font-semibold">Trips</h1>
        </header>

        {cards.length === 0 ? (
          <p className="text-neutral-500">No trips yet.</p>
        ) : (
          <TripStack trips={cards} />
        )}

        <form action={createTrip} className="flex gap-2">
          <input
            name="name"
            required
            maxLength={120}
            placeholder="New trip name"
            aria-label="New trip name"
            className="min-w-0 flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-base dark:border-neutral-700 dark:bg-neutral-950"
          />
          <button className="rounded-md bg-neutral-900 px-3 py-1.5 text-white dark:bg-white dark:text-neutral-900">
            Create
          </button>
        </form>
      </main>
    </div>
  );
}
