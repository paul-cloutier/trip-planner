"use client";

import { useEffect, useState } from "react";

// Launch screen for the home-screen app: solid blue, the pin in the middle.
// Server-rendered visible so the first paint is already the splash. It stays
// until the page has loaded and fonts are ready, never less than MIN_MS and
// never more than MAX_MS, so a stuck request cannot trap you behind it. It
// only exists in standalone mode (see the `standalone` variant); in a browser
// tab it is display:none.
const MIN_MS = 2000;
const MAX_MS = 10000;
const FADE_MS = 300;

function loaded() {
  const page =
    document.readyState === "complete"
      ? Promise.resolve()
      : new Promise<void>((done) => window.addEventListener("load", () => done(), { once: true }));
  return Promise.all([page, document.fonts.ready]);
}

export default function Splash() {
  const [phase, setPhase] = useState<"shown" | "leaving" | "gone">("shown");

  useEffect(() => {
    const start = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const ready = Promise.race([
      loaded(),
      new Promise((done) => setTimeout(done, MAX_MS)),
    ]);
    ready.then(() => {
      if (cancelled) return;
      timer = setTimeout(
        () => {
          setPhase("leaving");
          timer = setTimeout(() => setPhase("gone"), FADE_MS);
        },
        Math.max(0, MIN_MS - (Date.now() - start)),
      );
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-50 hidden items-center justify-center bg-[#0062cc] standalone:flex motion-safe:transition-opacity motion-safe:duration-300 ${
        phase === "leaving" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <svg
        width="112"
        height="112"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
        <circle cx="12" cy="9.5" r="2.5" />
      </svg>
    </div>
  );
}
