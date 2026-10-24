import Link from "next/link";

import { requireSpace } from "@/lib/space";

import { createTrip } from "./actions";
import { formatDay } from "./dates";

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

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-3 max-lg:pb-[var(--nav-inset)] lg:pt-16">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Trips</h1>
        <Link href="/" className="text-sm underline">
          Places
        </Link>
      </header>

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

      {trips.length === 0 ? (
        <p className="text-neutral-500">No trips yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-neutral-200 dark:divide-neutral-800">
          {trips.map((trip) => {
            const legs = [...trip.trip_legs].sort((a, b) => a.position - b.position);
            const start = legs.flatMap((l) => (l.starts_on ? [l.starts_on] : [])).sort()[0];
            const end = legs.flatMap((l) => (l.ends_on ? [l.ends_on] : [])).sort().at(-1);
            return (
              <li key={trip.id}>
                <Link href={`/trips/${trip.id}`} className="flex flex-col gap-0.5 py-3">
                  <span className="font-medium">{trip.name}</span>
                  <span className="text-sm text-neutral-500">
                    {start && end ? `${formatDay(start)} – ${formatDay(end)}` : "Draft, no dates"}
                    {legs.length > 0 && ` · ${legs.map((l) => l.city).join(", ")}`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
