"use client";

import dynamic from "next/dynamic";
import { useMemo, useOptimistic, useState, useTransition } from "react";

import type { Category } from "../../pool-types";
import { moveItem, removeItem } from "../actions";
import { daysBetween, formatDay } from "../dates";
import DayBoard from "./day-board";
import LegCalendar from "./leg-calendar";

// mapbox-gl touches window; load it only in the browser.
const PoolMap = dynamic(() => import("../../pool-map"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-neutral-100 dark:bg-neutral-900" />,
});

// Which pins the map shows: everything, the maybe shelf, or one day.
type MapFilter = "all" | "maybe" | string;

export type TripLeg = { id: string; city: string; startsOn: string | null; endsOn: string | null };
export type TripItem = {
  id: string;
  day: string | null;
  name: string;
  city: string | null;
  category: Category | null;
  lat: number;
  lng: number;
};

type ItemChange = { id: string; day: string | null } | { id: string; removed: true };

export default function TripView({
  tripId,
  legs,
  items,
  mapboxToken,
}: {
  tripId: string;
  legs: TripLeg[];
  items: TripItem[];
  mapboxToken: string | null;
}) {
  const [optimisticItems, applyChange] = useOptimistic(items, (all, change: ItemChange) =>
    "removed" in change
      ? all.filter((i) => i.id !== change.id)
      : all.map((i) => (i.id === change.id ? { ...i, day: change.day } : i)),
  );
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mapFilter, setMapFilter] = useState<MapFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Every day some dated leg covers, with the cities on it.
  const days = useMemo(() => {
    const cities = new Map<string, string[]>();
    for (const leg of legs) {
      if (!leg.startsOn || !leg.endsOn) continue;
      for (const d of daysBetween(leg.startsOn, leg.endsOn)) {
        cities.set(d, [...(cities.get(d) ?? []), leg.city]);
      }
    }
    return [...cities].sort(([a], [b]) => a.localeCompare(b)).map(([day, c]) => ({ day, cities: c }));
  }, [legs]);

  const cityOptions = useMemo(
    () => [...new Set([...legs.map((l) => l.city), ...items.flatMap((i) => (i.city ? [i.city] : []))])].sort(),
    [legs, items],
  );

  function run(change: ItemChange, action: () => Promise<{ ok: boolean }>) {
    setError(null);
    startTransition(async () => {
      applyChange(change);
      const result = await action();
      if (!result.ok) setError("Couldn't save that change. Try again.");
    });
  }

  const move = (item: TripItem, day: string | null) =>
    run({ id: item.id, day }, () => moveItem({ tripId, itemId: item.id, day }));
  const remove = (item: TripItem) =>
    run({ id: item.id, removed: true }, () => removeItem({ tripId, itemId: item.id }));

  const pins = useMemo(
    () =>
      optimisticItems.filter((i) =>
        mapFilter === "all" ? true : mapFilter === "maybe" ? !i.day : i.day === mapFilter,
      ),
    [optimisticItems, mapFilter],
  );

  // A tapped pin highlights its row; the board scrolls it into view.
  const selectPin = setSelectedId;
  // Choosing a chip lets go of a selected pin, so the board follows the chip.
  function pickFilter(f: MapFilter) {
    setMapFilter(f);
    setSelectedId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-[15px] text-danger">{error}</p>}

      {mapboxToken && (
        <section className="flex flex-col gap-2">
          <div className="-mx-4 h-[40dvh] sm:mx-0 sm:overflow-hidden sm:rounded-card">
            <PoolMap
              token={mapboxToken}
              saves={pins}
              selectedId={selectedId}
              moving={false}
              onSelect={selectPin}
              onMove={() => {}}
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto" role="group" aria-label="Show on map">
            <FilterChip label="All" active={mapFilter === "all"} onClick={() => pickFilter("all")} />
            {days.map(({ day, cities }) => (
              <FilterChip
                key={day}
                label={`${formatDay(day)} · ${cities.join("/")}`}
                count={optimisticItems.filter((i) => i.day === day).length}
                active={mapFilter === day}
                onClick={() => pickFilter(day)}
              />
            ))}
            <FilterChip
              label="Maybe"
              count={optimisticItems.filter((i) => !i.day).length}
              active={mapFilter === "maybe"}
              onClick={() => pickFilter("maybe")}
            />
          </div>
        </section>
      )}

      <DayBoard
        days={days}
        items={optimisticItems}
        cityOrder={legs.map((l) => l.city)}
        focusDay={mapFilter === "all" || mapFilter === "maybe" ? null : mapFilter}
        selectedId={selectedId}
        onMove={move}
        onRemove={remove}
      />

      <LegCalendar tripId={tripId} legs={legs} cityOptions={cityOptions} onError={setError} />
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="h-9 shrink-0 rounded-full px-3.5 text-[15px] font-medium control aria-pressed:pressed"
    >
      {label}
      {count !== undefined && <span className="tabular-nums opacity-70"> {count}</span>}
    </button>
  );
}
