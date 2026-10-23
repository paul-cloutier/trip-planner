import "server-only";

import { requireUser } from "@/lib/auth";

// The signed-in user and the space they belong to. Every query on user data
// filters by this spaceId; RLS backs it. null when they are in no space yet.
export async function requireSpace() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("space_members")
    .select("space_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Could not load space");
  return { supabase, user, spaceId: data?.space_id ?? null };
}
