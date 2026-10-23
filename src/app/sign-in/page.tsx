"use client";

import { useActionState, useState } from "react";

import {
  sendCode,
  signInWithPassword,
  verifyCode,
  type PasswordState,
  type SignInState,
} from "./actions";

const input = "rounded-md border border-neutral-300 px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-950";
const button = "rounded-md bg-neutral-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900";

export default function SignInPage() {
  const [mode, setMode] = useState<"password" | "code">("password");
  const [passwordState, passwordAction, signingIn] = useActionState<PasswordState, FormData>(
    signInWithPassword,
    {},
  );
  const [emailState, emailAction, sending] = useActionState<SignInState, FormData>(sendCode, {
    step: "email",
  });
  const [codeState, codeAction, verifying] = useActionState<SignInState, FormData>(verifyCode, {
    step: "email",
  });

  const state = codeState.step === "code" ? codeState : emailState;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold">Trips</h1>

      {mode === "password" ? (
        <form action={passwordAction} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Email
            <input name="email" type="email" autoComplete="email" required className={input} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              className={input}
            />
          </label>
          <button disabled={signingIn} className={button}>
            {signingIn ? "Signing in…" : "Sign in"}
          </button>
          {passwordState.error && <p className="text-sm text-red-600">{passwordState.error}</p>}
          <button
            type="button"
            onClick={() => setMode("code")}
            className="self-start text-sm text-neutral-500 underline"
          >
            Email me a code instead
          </button>
        </form>
      ) : state.step === "email" ? (
        <form action={emailAction} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Email
            <input name="email" type="email" autoComplete="email" required className={input} />
          </label>
          <button disabled={sending} className={button}>
            {sending ? "Sending…" : "Send me a code"}
          </button>
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          <button
            type="button"
            onClick={() => setMode("password")}
            className="self-start text-sm text-neutral-500 underline"
          >
            Use my password instead
          </button>
        </form>
      ) : (
        <form action={codeAction} className="flex flex-col gap-3">
          <p className="text-sm text-neutral-600">
            If {state.email} has an account, a 6-digit code is on its way.
          </p>
          <input type="hidden" name="email" value={state.email} />
          <label className="flex flex-col gap-1 text-sm">
            Code
            <input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
              className={`${input} tracking-widest`}
            />
          </label>
          <button disabled={verifying} className={button}>
            {verifying ? "Checking…" : "Sign in"}
          </button>
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        </form>
      )}
    </main>
  );
}
