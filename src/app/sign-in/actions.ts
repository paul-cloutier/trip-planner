"use server";
// @public-action: signing in is, by definition, done before there is a user.
// Only existing accounts get a code (shouldCreateUser: false) or can use a
// password; sign-up is off, so neither creates an account.

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type SignInState =
  | { step: "email"; error?: string }
  | { step: "code"; email: string; error?: string };

export type PasswordState = { error?: string };

const emailSchema = z.object({ email: z.email().max(320) }).strict();
const passwordSchema = z
  .object({ email: z.email().max(320), password: z.string().min(8).max(200) })
  .strict();
const codeSchema = z
  .object({ email: z.email().max(320), code: z.string().regex(/^\d{6}$/) })
  .strict();

export async function sendCode(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { step: "email", error: "That doesn't look like an email address." };

  const email = parsed.data.email.toLowerCase();
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  // Unknown addresses fail here. Log it, but move on to the code step either
  // way so the form does not reveal who has an account.
  if (error) console.error("sign-in: send code failed", error.code);

  return { step: "code", email };
}

export async function verifyCode(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = codeSchema.safeParse({
    email: formData.get("email"),
    code: formData.get("code"),
  });
  if (!parsed.success) {
    const email = String(formData.get("email") ?? "");
    return { step: "code", email, error: "Enter the 6-digit code from the email." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.code,
    type: "email",
  });
  if (error) {
    console.error("sign-in: verify failed", error.code);
    return { step: "code", email: parsed.data.email, error: "That code didn't work. Try again." };
  }

  redirect("/");
}

export async function signInWithPassword(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const parsed = passwordSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  // One message for every failure, so the form does not reveal who has an
  // account. Supabase's auth rate limits apply to repeated tries.
  const failed = { error: "That email and password didn't match." };
  if (!parsed.success) return failed;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email.toLowerCase(),
    password: parsed.data.password,
  });
  if (error) {
    console.error("sign-in: password failed", error.code);
    return failed;
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
