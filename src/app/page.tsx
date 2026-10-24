import Link from "next/link";

import { requireUser } from "@/lib/auth";

import PoolView from "./pool-view";
import type { PoolSave } from "./pool-types";
import { signOut } from "./sign-in/actions";

// Enough for every place two people will save for a long while (the Google
// lists alone came to about 700). Past this the pool needs filtering by city in
// the query, not just on screen.
const POOL_LIMIT = 2000;

export default async function PoolPage() {
  const { supabase, user } = await requireUser();

  const { data: membership, error: membershipError } = await supabase
    .from("space_members")
    .select("space_id, spaces(name)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (membershipError) throw new Error("Could not load space");
  if (!membership) {
    return <Shell title="Trips">You are not in a space yet.</Shell>;
  }

  const spaceId = membership.space_id;

  const [
    { data: members, error: membersError },
    { data: saves, error: savesError },
    { data: trips, error: tripsError },
  ] = await Promise.all([
      supabase
        .from("space_members")
        .select("user_id, display_name")
        .eq("space_id", spaceId)
        .limit(20),
      supabase
        .from("saves")
        .select(
          "id, via, why, category, status, added_by, pin_lat, pin_lng, place:places(name, city, lat, lng), trip_items(trip_id)",
        )
        .eq("space_id", spaceId)
        .order("added_at", { ascending: false })
        .limit(POOL_LIMIT),
      supabase
        .from("trips")
        .select("id, name")
        .eq("space_id", spaceId)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
  if (membersError || savesError || tripsError) throw new Error("Could not load pool");

  const nameOf = new Map(members.map((m) => [m.user_id, m.display_name]));

  // Pick exactly what the screen needs; nothing else crosses to the browser.
  const pool: PoolSave[] = saves.flatMap((s) =>
    s.place
      ? [
          {
            id: s.id,
            name: s.place.name,
            city: s.place.city,
            category: s.category as PoolSave["category"],
            status: s.status as PoolSave["status"],
            via: s.via,
            why: s.why,
            addedBy: (s.added_by && nameOf.get(s.added_by)) ?? "someone",
            lat: s.pin_lat ?? s.place.lat,
            lng: s.pin_lng ?? s.place.lng,
            moved: s.pin_lat !== null,
            tripIds: s.trip_items.map((t) => t.trip_id),
          },
        ]
      : [],
  );

  return (
    <PoolView
      title={membership.spaces?.name ?? "Our places"}
      initialSaves={pool}
      trips={trips.map((t) => ({ id: t.id, name: t.name }))}
      mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? null}
      nav={null}
      footer={null}
    />
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col">
      <header className="flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-semibold">{title}</h1>
        <div className="flex items-center gap-4">
          <Link href="/trips" className="text-sm underline">
            Trips
          </Link>
          <form action={signOut}>
            <button className="text-sm text-neutral-500 underline">Sign out</button>
          </form>
        </div>
      </header>
      {children}
    </main>
  );
}
