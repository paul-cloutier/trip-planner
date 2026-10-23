"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth";

const CATEGORIES = ["eat", "coffee", "drink", "shop", "records", "books", "see", "stay"] as const;

const updateSaveSchema = z
  .object({
    saveId: z.uuid(),
    category: z.enum(CATEGORIES).nullable().optional(),
    pin: z
      .object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })
      .strict()
      .nullable()
      .optional(),
    status: z.enum(["want", "been"]).optional(),
    // Blank means "no note"; stored as null.
    via: z.string().trim().max(200).transform((v) => v || null).optional(),
    why: z.string().trim().max(2000).transform((v) => v || null).optional(),
  })
  .strict();

// Change a save: category, pin, want/been, via and why. Only the fields given. Members of the save's space only:
// the update is scoped to the caller's space in the query, and RLS backs it.
export async function updateSave(input: z.input<typeof updateSaveSchema>) {
  const { supabase, user } = await requireUser();

  const parsed = updateSaveSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const };
  const { saveId, category, pin, status, via, why } = parsed.data;

  const { data: membership } = await supabase
    .from("space_members")
    .select("space_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) return { ok: false as const };

  const changes: {
    category?: (typeof CATEGORIES)[number] | null;
    pin_lat?: number | null;
    pin_lng?: number | null;
    status?: "want" | "been";
    visited_on?: string | null;
    via?: string | null;
    why?: string | null;
  } = {};
  if (category !== undefined) changes.category = category;
  if (status !== undefined) {
    changes.status = status;
    // Marking been records today; going back to want clears it.
    changes.visited_on = status === "been" ? new Date().toISOString().slice(0, 10) : null;
  }
  if (via !== undefined) changes.via = via;
  if (why !== undefined) changes.why = why;
  if (pin !== undefined) {
    changes.pin_lat = pin?.lat ?? null;
    changes.pin_lng = pin?.lng ?? null;
  }

  const { error, count } = await supabase
    .from("saves")
    .update(changes, { count: "exact" })
    .eq("id", saveId)
    .eq("space_id", membership.space_id);
  if (error || count !== 1) {
    console.error("updateSave failed", error?.code, count);
    return { ok: false as const };
  }

  revalidatePath("/");
  return { ok: true as const };
}
