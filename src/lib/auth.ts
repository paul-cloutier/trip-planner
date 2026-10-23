import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

// The verified user, or a redirect to sign in. getUser() checks the token with
// the auth server rather than trusting the cookie. Returns the client too, so
// callers query as that user with row level security applied.
export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/sign-in");
  return { supabase, user: data.user };
}
