"use client";

import Link from "next/link";
import { useState } from "react";

// Trips as a wallet of cards. The selected card sits up front at full height;
// the ones after it stack below with just their title strip showing, the ones
// before it tuck behind with a sliver. Tap a strip to bring it forward, tap
// the front card to open the trip.
export type StackTrip = {
  id: string;
  name: string;
  dates: string | null;
  cities: string[];
  image: string | null;
};

const CARD_H = 280;
const PEEK = 64; // title strip of a card waiting in the stack
const LAP = 24; // how far a card runs under the next one, to hide its corners
const TOP = 10; // sliver of each card tucked behind the front one
const BEHIND = 4; // most slivers shown
const GAP = 10;
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

function fallback(name: string) {
  let hue = 0;
  for (const ch of name) hue = (hue * 31 + ch.charCodeAt(0)) % 360;
  return `linear-gradient(135deg, hsl(${hue} 55% 46%), hsl(${(hue + 50) % 360} 60% 26%))`;
}

export default function TripStack({ trips }: { trips: StackTrip[] }) {
  const [selected, setSelected] = useState(0);
  const sel = Math.min(selected, trips.length - 1);
  const after = trips.length - 1 - sel;
  const selY = Math.min(sel, BEHIND) * TOP;
  const height = selY + CARD_H + (after > 0 ? GAP + after * PEEK + LAP : 0);

  return (
    <ul
      className="relative w-full list-none motion-safe:transition-[height] motion-safe:duration-500"
      style={{ height, transitionTimingFunction: EASE }}
    >
      {trips.map((trip, i) => {
        const front = i === sel;
        const behind = sel - i;
        const y = front
          ? selY
          : behind > 0
            ? selY - Math.min(behind, BEHIND) * TOP
            : selY + CARD_H + GAP + (i - sel - 1) * PEEK;
        const scale = behind > 0 ? 1 - Math.min(behind, BEHIND) * 0.03 : 1;
        const z = front ? 50 : behind > 0 ? i : 60 + i;

        const surface = (
          <div className="absolute inset-x-0 top-0 text-white" style={{ height: CARD_H }}>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: trip.image ? `url("${trip.image}")` : fallback(trip.name),
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/5 to-black/65" />
            <div className="absolute inset-x-0 top-0 flex h-16 items-center justify-between gap-3 px-5">
              <span className="truncate text-[22px] font-bold tracking-tight [text-shadow:0_1px_8px_rgb(0_0_0/0.45)]">
                {trip.name}
              </span>
              <span className="shrink-0 text-[13px] font-medium opacity-90 [text-shadow:0_1px_6px_rgb(0_0_0/0.5)]">
                {trip.dates ?? "No dates"}
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-5 pb-4">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium [text-shadow:0_1px_6px_rgb(0_0_0/0.5)]">
                  {trip.cities.length > 0 ? trip.cities.join(" · ") : "No cities yet"}
                </p>
                {trip.image && <p className="mt-0.5 text-[11px] opacity-70">Photo: Wikipedia</p>}
              </div>
              <span className="shrink-0 rounded-full bg-white/25 px-3.5 py-1.5 text-[14px] font-semibold backdrop-blur-md">
                Open
              </span>
            </div>
          </div>
        );

        return (
          <li
            key={trip.id}
            className="absolute inset-x-0 top-0 origin-top overflow-hidden rounded-[22px] shadow-[0_6px_20px_rgb(0_0_0/0.28)] motion-safe:transition-[transform,height] motion-safe:duration-500"
            style={{
              height: front ? CARD_H : PEEK + LAP,
              transform: `translateY(${y}px) scale(${scale})`,
              zIndex: z,
              transitionTimingFunction: EASE,
            }}
          >
            {front ? (
              <Link href={`/trips/${trip.id}`} aria-label={`Open ${trip.name}`} className="block h-full w-full">
                {surface}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setSelected(i)}
                aria-label={`Show ${trip.name}`}
                className="block h-full w-full text-left"
              >
                {surface}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
