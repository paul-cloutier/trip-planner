"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";

import { CATEGORY_COLOR, UNSORTED_COLOR, type Category } from "../../pool-types";
import { deleteLeg, moveItem, removeItem, saveLeg } from "../actions";
import { daysBetween, formatDay } from "../dates";

export type TripLeg = { id: string; city: string; startsOn: string | null; endsOn: string | null };
export type TripItem = {
  id: string;
  day: string | null;
  name: string;
  city: string | null;
  category: Category | null;
};

type ItemChange = { id: string; day: string | null } | { id: string; removed: true };

export default function TripView({
  tripId,
  legs,
  items,
}: {
  tripId: string;
  legs: TripLeg[];
  items: TripItem[];
}) {
  const [optimisticItems, applyChange] = useOptimistic(items, (all, change: ItemChange) =>
    "removed" in change
      ? all.filter((i) => i.id !== change.id)
      : all.map((i) => (i.id === change.id ? { ...i, day: change.day } : i)),
  );
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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

  // Shelf grouped by city, the trip's own cities first in leg order.
  const shelf = useMemo(() => {
    const groups = new Map<string, TripItem[]>();
    for (const i of optimisticItems.filter((i) => !i.day)) {
      const c = i.city ?? "Elsewhere";
      groups.set(c, [...(groups.get(c) ?? []), i]);
    }
    const legOrder = legs.map((l) => l.city);
    const rank = (c: string) => (legOrder.includes(c) ? legOrder.indexOf(c) : legOrder.length);
    return [...groups].sort(([a, ai], [b, bi]) => rank(a) - rank(b) || bi.length - ai.length);
  }, [optimisticItems, legs]);

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

  const itemProps = { days, onMove: move, onRemove: remove };

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Cities</h2>
        <datalist id="trip-cities">
          {cityOptions.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        {legs.map((leg) => (
          <LegForm key={leg.id} tripId={tripId} leg={leg} onError={setError} />
        ))}
        <LegForm tripId={tripId} onError={setError} />
      </section>

      {days.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-semibold">Days</h2>
          {days.map(({ day, cities }) => {
            const onDay = optimisticItems.filter((i) => i.day === day);
            return (
              <div key={day} className="flex flex-col gap-1">
                <h3 className="text-sm">
                  <span className="font-medium">{formatDay(day)}</span>{" "}
                  <span className="text-neutral-500">{cities.join(" → ")}</span>
                </h3>
                {onDay.length === 0 ? (
                  <p className="text-sm text-neutral-400">Nothing planned.</p>
                ) : (
                  <ul className="flex flex-col divide-y divide-neutral-200 dark:divide-neutral-800">
                    {onDay.map((i) => (
                      <ItemRow key={i.id} item={i} {...itemProps} />
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="font-semibold">
          Maybe <span className="font-normal text-neutral-500">{shelf.reduce((n, [, g]) => n + g.length, 0)}</span>
        </h2>
        {shelf.length === 0 && <p className="text-sm text-neutral-400">Shelf is empty.</p>}
        {shelf.map(([city, group]) => (
          <div key={city} className="flex flex-col gap-1">
            <h3 className="text-sm font-medium">
              {city} <span className="font-normal text-neutral-500">{group.length}</span>
            </h3>
            <ul className="flex flex-col divide-y divide-neutral-200 dark:divide-neutral-800">
              {group.map((i) => (
                <ItemRow key={i.id} item={i} {...itemProps} />
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}

function ItemRow({
  item,
  days,
  onMove,
  onRemove,
}: {
  item: TripItem;
  days: { day: string; cities: string[] }[];
  onMove: (item: TripItem, day: string | null) => void;
  onRemove: (item: TripItem) => void;
}) {
  // Days in this place's city first: they are almost always the right ones.
  const ordered = [
    ...days.filter((d) => item.city && d.cities.includes(item.city)),
    ...days.filter((d) => !item.city || !d.cities.includes(item.city)),
  ];
  return (
    <li className="flex items-center gap-2 py-1.5">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: item.category ? CATEGORY_COLOR[item.category] : UNSORTED_COLOR }}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate text-sm">{item.name}</span>
      <select
        value={item.day ?? ""}
        onChange={(e) => onMove(item, e.target.value || null)}
        aria-label={`Day for ${item.name}`}
        className="max-w-36 shrink-0 rounded-md border border-neutral-300 bg-transparent px-1 py-0.5 text-xs dark:border-neutral-700"
      >
        <option value="">Maybe</option>
        {ordered.map((d) => (
          <option key={d.day} value={d.day}>
            {formatDay(d.day)} · {d.cities.join("/")}
          </option>
        ))}
      </select>
      <button
        onClick={() => onRemove(item)}
        aria-label={`Remove ${item.name} from trip`}
        className="shrink-0 px-1 text-neutral-400"
      >
        ✕
      </button>
    </li>
  );
}

function LegForm({
  tripId,
  leg,
  onError,
}: {
  tripId: string;
  leg?: TripLeg;
  onError: (message: string | null) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);

  function submit(form: FormData) {
    const city = String(form.get("city") ?? "").trim();
    const startsOn = String(form.get("startsOn") ?? "") || null;
    const endsOn = String(form.get("endsOn") ?? "") || null;
    if (!city) return;
    if ((startsOn === null) !== (endsOn === null)) {
      onError("Give a city both dates, or neither.");
      return;
    }
    onError(null);
    startTransition(async () => {
      const result = await saveLeg({ tripId, legId: leg?.id, city, startsOn, endsOn });
      if (!result.ok) onError("Couldn't save that city. Check the dates.");
      else if (!leg) setFormKey((k) => k + 1);
    });
  }

  function remove() {
    if (!leg) return;
    startTransition(async () => {
      const result = await deleteLeg({ tripId, legId: leg.id });
      if (!result.ok) onError("Couldn't remove that city.");
    });
  }

  const input =
    "rounded-md border border-neutral-300 bg-transparent px-2 py-1 text-base sm:text-sm dark:border-neutral-700";

  return (
    <form key={formKey} action={submit} className="flex flex-wrap items-center gap-2">
      <input
        name="city"
        list="trip-cities"
        defaultValue={leg?.city}
        placeholder={leg ? undefined : "Add a city"}
        aria-label="City"
        required
        maxLength={80}
        className={`${input} w-36`}
      />
      <input name="startsOn" type="date" defaultValue={leg?.startsOn ?? ""} aria-label="From" className={input} />
      <span className="text-neutral-400">–</span>
      <input name="endsOn" type="date" defaultValue={leg?.endsOn ?? ""} aria-label="To" className={input} />
      <button disabled={pending} className="text-sm underline disabled:opacity-50">
        {leg ? "Save" : "Add"}
      </button>
      {leg && (
        <button type="button" onClick={remove} disabled={pending} className="text-sm text-neutral-500 underline">
          Remove
        </button>
      )}
    </form>
  );
}
