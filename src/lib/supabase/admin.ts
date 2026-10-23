import "server-only";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/lib/database.types";
import { supabaseUrl } from "@/lib/env";

// Bypasses RLS. Used for one thing: writing rows into `places`, which is
// shared across spaces and so must only ever hold data we fetched ourselves
// (from OpenStreetMap), never values a browser sent us.
export function createAdminClient() {
  const secret = z.string().min(1).parse(process.env.SUPABASE_SECRET_KEY);
  return createClient<Database>(supabaseUrl, secret, { auth: { persistSession: false } });
}
