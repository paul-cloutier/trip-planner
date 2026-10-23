"use server";
// Every action here: signed-in member of the trip's space. Identity from the
// session, space from membership, and every query filters by that space.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireSpace } from "@/lib/space";

const date = z.iso.date();
const fail = { ok: false as const };
const done = { ok: true as const };

const createTripSchema = z.object({ name: z.string().trim().min(1).max(120) }).strict();

export async function createTrip(form: FormData) {
  const { supabase, user, spaceId } = await requireSpace();
  const parsed = createTripSchema.safeParse({ name: form.get("name") });
  if (!spaceId || !parsed.success) return;

  const { data, error } = await supabase
    .from("trips")
    .insert({ space_id: spaceId, name: parsed.data.name, created_by: user.id })
    .select("id")
    .single();
  if (error) {
    console.error("createTrip failed", error.code);
    return;
  }
  redirect(`/trips/${data.id}`);
}

const legSchema = z
  .object({
    tripId: z.uuid(),
    legId: z.uuid().optional(),
    city: z.string().trim().min(1).max(80),
    startsOn: date.nullable(),
    endsOn: date.nullable(),
  })
  .strict()
  .refine((l) => (l.startsOn === null) === (l.endsOn === null), "both dates or neither")
  .refine((l) => !l.startsOn || !l.endsOn || l.endsOn >= l.startsOn, "ends before it starts");

// Add a leg, or change one when legId is given.
export async function saveLeg(input: z.input<typeof legSchema>) {
  const { supabase, spaceId } = await requireSpace();
  const parsed = legSchema.safeParse(input);
  if (!spaceId || !parsed.success) return fail;
  const { tripId, legId, city, startsOn, endsOn } = parsed.data;
  const values = { city, starts_on: startsOn, ends_on: endsOn };

  const { error } = legId
    ? await supabase
        .from("trip_legs")
        .update(values)
        .eq("id", legId)
        .eq("trip_id", tripId)
        .eq("space_id", spaceId)
    : await supabase.from("trip_legs").insert({ ...values, trip_id: tripId, space_id: spaceId });
  if (error) {
    console.error("saveLeg failed", error.code);
    return fail;
  }

  return reconcile(supabase, tripId);
}

const deleteLegSchema = z.object({ tripId: z.uuid(), legId: z.uuid() }).strict();

export async function deleteLeg(input: z.input<typeof deleteLegSchema>) {
  const { supabase, spaceId } = await requireSpace();
  const parsed = deleteLegSchema.safeParse(input);
  if (!spaceId || !parsed.success) return fail;

  const { error } = await supabase
    .from("trip_legs")
    .delete()
    .eq("id", parsed.data.legId)
    .eq("trip_id", parsed.data.tripId)
    .eq("space_id", spaceId);
  if (error) {
    console.error("deleteLeg failed", error.code);
    return fail;
  }
  return reconcile(supabase, parsed.data.tripId);
}

const addToTripSchema = z.object({ tripId: z.uuid(), saveId: z.uuid() }).strict();

// Pull a saved place into a trip, onto its maybe shelf. Already there is fine.
export async function addToTrip(input: z.input<typeof addToTripSchema>) {
  const { supabase, spaceId } = await requireSpace();
  const parsed = addToTripSchema.safeParse(input);
  if (!spaceId || !parsed.success) return fail;

  // The composite foreign keys refuse a trip or save from another space.
  const { error } = await supabase
    .from("trip_items")
    .upsert(
      { trip_id: parsed.data.tripId, save_id: parsed.data.saveId, space_id: spaceId },
      { onConflict: "trip_id,save_id", ignoreDuplicates: true },
    );
  if (error) {
    console.error("addToTrip failed", error.code);
    return fail;
  }
  revalidatePath(`/trips/${parsed.data.tripId}`);
  return done;
}

const moveItemSchema = z
  .object({ tripId: z.uuid(), itemId: z.uuid(), day: date.nullable() })
  .strict();

// Put a place on a day, or back on the maybe shelf (day null).
export async function moveItem(input: z.input<typeof moveItemSchema>) {
  const { supabase, spaceId } = await requireSpace();
  const parsed = moveItemSchema.safeParse(input);
  if (!spaceId || !parsed.success) return fail;
  const { tripId, itemId, day } = parsed.data;

  if (day) {
    // The day has to fall inside one of this trip's dated legs.
    const { data: legs, error } = await supabase
      .from("trip_legs")
      .select("id")
      .eq("trip_id", tripId)
      .eq("space_id", spaceId)
      .lte("starts_on", day)
      .gte("ends_on", day)
      .limit(1);
    if (error || legs.length === 0) return fail;
  }

  const { error, count } = await supabase
    .from("trip_items")
    .update({ day }, { count: "exact" })
    .eq("id", itemId)
    .eq("trip_id", tripId)
    .eq("space_id", spaceId);
  if (error || count !== 1) {
    console.error("moveItem failed", error?.code, count);
    return fail;
  }
  revalidatePath(`/trips/${tripId}`);
  return done;
}

const removeItemSchema = z.object({ tripId: z.uuid(), itemId: z.uuid() }).strict();

// Take a place out of the trip. It stays in the pool.
export async function removeItem(input: z.input<typeof removeItemSchema>) {
  const { supabase, spaceId } = await requireSpace();
  const parsed = removeItemSchema.safeParse(input);
  if (!spaceId || !parsed.success) return fail;

  const { error } = await supabase
    .from("trip_items")
    .delete()
    .eq("id", parsed.data.itemId)
    .eq("trip_id", parsed.data.tripId)
    .eq("space_id", spaceId);
  if (error) {
    console.error("removeItem failed", error.code);
    return fail;
  }
  revalidatePath(`/trips/${parsed.data.tripId}`);
  return done;
}

async function reconcile(supabase: Awaited<ReturnType<typeof requireSpace>>["supabase"], tripId: string) {
  const { error } = await supabase.rpc("reconcile_trip_days", { target: tripId });
  if (error) {
    console.error("reconcile_trip_days failed", error.code);
    return fail;
  }
  revalidatePath(`/trips/${tripId}`);
  return done;
}
