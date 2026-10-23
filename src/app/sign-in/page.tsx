"use client";

import { useActionState } from "react";

import { sendCode, verifyCode, type SignInState } from "./actions";

export default function SignInPage() {
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

      {state.step === "email" ? (
        <form action={emailAction} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="rounded-md border border-neutral-300 px-3 py-2 text-base"
            />
          </label>
          <button
            disabled={sending}
            className="rounded-md bg-neutral-900 px-3 py-2 text-white disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send me a code"}
          </button>
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
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
              className="rounded-md border border-neutral-300 px-3 py-2 text-base tracking-widest"
            />
          </label>
          <button
            disabled={verifying}
            className="rounded-md bg-neutral-900 px-3 py-2 text-white disabled:opacity-50"
          >
            {verifying ? "Checking…" : "Sign in"}
          </button>
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        </form>
      )}
    </main>
  );
}
