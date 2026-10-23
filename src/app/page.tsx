import { requireUser } from "@/lib/auth";

import { signOut } from "./sign-in/actions";

// Enough for every place two people will save for a long while. Past this the
// pool needs filtering by city in the query, not just on screen.
const POOL_LIMIT = 500;

const CATEGORY_LABEL: Record<string, string> = {
  eat: "Eat",
  coffee: "Coffee",
  drink: "Drink",
  shop: "Shop",
  see: "See",
  do: "Do",
  stay: "Stay",
};

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

  const [{ data: members, error: membersError }, { data: saves, error: savesError }] =
    await Promise.all([
      supabase
        .from("space_members")
        .select("user_id, display_name")
        .eq("space_id", spaceId)
        .limit(20),
      supabase
        .from("saves")
        .select(
          "id, via, why, category, status, added_by, place:places(name, city, country, google_primary_type)",
        )
        .eq("space_id", spaceId)
        .order("added_at", { ascending: false })
        .limit(POOL_LIMIT),
    ]);
  if (membersError || savesError) throw new Error("Could not load pool");

  const nameOf = new Map(members.map((m) => [m.user_id, m.display_name]));

  const byCity = new Map<string, typeof saves>();
  for (const save of saves) {
    const city = save.place?.city ?? "Somewhere";
    byCity.set(city, [...(byCity.get(city) ?? []), save]);
  }
  const cities = [...byCity.keys()].sort((a, b) => a.localeCompare(b));

  return (
    <Shell title={membership.spaces?.name ?? "Our places"}>
      {saves.length === 0 ? (
        <p className="text-neutral-500">
          Nothing saved yet. Importing your Google lists comes next.
        </p>
      ) : (
        cities.map((city) => (
          <section key={city} className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">
              {city} <span className="text-neutral-500">{byCity.get(city)?.length}</span>
            </h2>
            <ul className="flex flex-col divide-y divide-neutral-200 dark:divide-neutral-800">
              {byCity.get(city)?.map((save) => (
                <li key={save.id} className="flex flex-col gap-0.5 py-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">{save.place?.name}</span>
                    <span className="shrink-0 text-xs text-neutral-500">
                      {save.category ? (CATEGORY_LABEL[save.category] ?? save.category) : "Unsorted"}
                      {save.status === "been" ? " · been" : ""}
                    </span>
                  </div>
                  {(save.via || save.why) && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {save.via && <span>via {save.via}</span>}
                      {save.via && save.why && " · "}
                      {save.why}
                    </p>
                  )}
                  <p className="text-xs text-neutral-500">
                    added by {(save.added_by && nameOf.get(save.added_by)) ?? "someone"}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <form action={signOut}>
          <button className="text-sm text-neutral-500 underline">Sign out</button>
        </form>
      </header>
      {children}
    </main>
  );
}
