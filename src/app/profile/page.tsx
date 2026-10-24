import { requireSpace } from "@/lib/space";

import { signOut } from "../sign-in/actions";

// Signed-in members only; requireUser() redirects everyone else to sign in.
export default async function ProfilePage() {
  const { supabase, user, spaceId, spaceName, displayName } = await requireSpace();

  const { data: members, error } = spaceId
    ? await supabase
        .from("space_members")
        .select("user_id, display_name")
        .eq("space_id", spaceId)
        .order("joined_at", { ascending: true })
        .limit(20)
    : { data: [], error: null };
  if (error) throw new Error("Could not load profile");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 bg-grouped px-4 pt-6 pb-[var(--nav-inset)] lg:pt-[76px] lg:pb-6">
      <h1 className="text-[22px] font-bold tracking-[-0.01em]">Profile</h1>

      <dl className="card flex flex-col divide-y divide-separator rounded-card px-4 text-[17px]">
        <Row label="Name" value={displayName ?? "—"} />
        <Row label="Email" value={user.email ?? "—"} />
      </dl>

      <section className="flex flex-col gap-2">
        <h2 className="px-1 text-[13px] font-semibold tracking-wide text-secondary uppercase">
          {spaceName ?? "No space"}
        </h2>
        <dl className="card flex flex-col divide-y divide-separator rounded-card px-4 text-[17px]">
          {members.map((m) => (
            <Row
              key={m.user_id}
              label={m.display_name}
              value={m.user_id === user.id ? "You" : "Member"}
            />
          ))}
        </dl>
      </section>

      <form action={signOut}>
        <button className="control h-11 w-full rounded-control text-[17px] font-semibold text-danger">
          Sign out
        </button>
      </form>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="text-secondary">{label}</dt>
      <dd className="min-w-0 truncate">{value}</dd>
    </div>
  );
}
