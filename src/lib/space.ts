import "server-only";

import { requireUser } from "@/lib/auth";

// The signed-in user and the space they are working in. Every query on user
// data filters by this spaceId; RLS backs it. spaceId is null when they are in
// no space yet.
//
// This is the one place that decides "which space". Today a person is in one
// space, and the order below only makes the answer stable if that ever stops
// being true. When someone can belong to several (a shared trip, a second
// team), this is where the active space gets picked, from a cookie checked
// against space_members. Nothing else should look up membership itself.
export async function requireSpace() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("space_members")
    .select("space_id, display_name, spaces(name)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true })
    .order("space_id", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Could not load space");
  return {
    supabase,
    user,
    spaceId: data?.space_id ?? null,
    spaceName: data?.spaces?.name ?? null,
    displayName: data?.display_name ?? null,
  };
}
