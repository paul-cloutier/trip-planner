"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 py-6">
      <p>Something went wrong loading this page.</p>
      <button onClick={reset} className="self-start text-sm underline">
        Try again
      </button>
    </main>
  );
}
