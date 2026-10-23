"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useTransition } from "react";

import Link from "next/link";

import { updateSave } from "./actions";
import { addToTrip } from "./trips/actions";
import {
  CATEGORIES,
  CATEGORY_COLOR,
  CATEGORY_LABEL,
  UNSORTED_COLOR,
  type Category,
  type PoolSave,
  type TripOption,
} from "./pool-types";

// mapbox-gl touches window; load it only in the browser, and only here.
const PoolMap = dynamic(() => import("./pool-map"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-neutral-100 dark:bg-neutral-900" />,
});

export default function PoolView({
  initialSaves,
  trips,
  mapboxToken,
}: {
  initialSaves: PoolSave[];
  trips: TripOption[];
  mapboxToken: string | null;
}) {
  const [saves, setSaves] = useState(initialSaves);
  const [city, setCity] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const cities = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of saves) {
      const c = s.city ?? "Elsewhere";
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    return [...counts].sort((a, b) => b[1] - a[1]);
  }, [saves]);

  const visible = useMemo(
    () => (city ? saves.filter((s) => (s.city ?? "Elsewhere") === city) : saves),
    [saves, city],
  );
  const selected = saves.find((s) => s.id === selectedId) ?? null;

  function select(id: string | null) {
    setSelectedId(id);
    setMoving(false);
    setEditingNote(false);
  }

  // Apply locally first, then save; put it back if the save fails.
  function change(id: string, patch: Partial<PoolSave>, send: Parameters<typeof updateSave>[0]) {
    const before = saves.find((s) => s.id === id);
    if (!before) return;
    setError(null);
    setSaves((all) => all.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    startTransition(async () => {
      const result = await updateSave(send);
      if (!result.ok) {
        setSaves((all) => all.map((s) => (s.id === id ? before : s)));
        setError("Couldn't save that change. Try again.");
      }
    });
  }

  function setCategory(category: Category | null) {
    if (!selected) return;
    change(selected.id, { category }, { saveId: selected.id, category });
  }

  function setStatus(status: PoolSave["status"]) {
    if (!selected || selected.status === status) return;
    change(selected.id, { status }, { saveId: selected.id, status });
  }

  function saveNote(form: FormData) {
    if (!selected) return;
    const via = String(form.get("via") ?? "").trim();
    const why = String(form.get("why") ?? "").trim();
    change(selected.id, { via: via || null, why: why || null }, { saveId: selected.id, via, why });
    setEditingNote(false);
  }

  function addSelectedToTrip(tripId: string) {
    if (!selected || selected.tripIds.includes(tripId)) return;
    const id = selected.id;
    setError(null);
    setSaves((all) => all.map((s) => (s.id === id ? { ...s, tripIds: [...s.tripIds, tripId] } : s)));
    startTransition(async () => {
      const result = await addToTrip({ tripId, saveId: id });
      if (!result.ok) {
        setSaves((all) =>
          all.map((s) => (s.id === id ? { ...s, tripIds: s.tripIds.filter((t) => t !== tripId) } : s)),
        );
        setError("Couldn't add it to that trip. Try again.");
      }
    });
  }

  function movePin(pin: { lat: number; lng: number }) {
    if (!selected) return;
    change(selected.id, { ...pin, moved: true }, { saveId: selected.id, pin });
  }

  return (
    <div className="flex flex-col">
      <div className="relative h-[50dvh] w-full">
        {mapboxToken ? (
          <PoolMap
            token={mapboxToken}
            saves={visible}
            selectedId={selectedId}
            moving={moving}
            onSelect={select}
            onMove={movePin}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-neutral-100 px-4 text-center text-sm text-neutral-500 dark:bg-neutral-900">
            Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to .env.local to see the map.
          </div>
        )}

        {selected && (
          <div className="absolute inset-x-2 bottom-2 max-h-[calc(100%-1rem)] overflow-y-auto rounded-lg bg-white p-3 shadow-lg dark:bg-neutral-900">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{selected.name}</p>
                <p className="text-xs text-neutral-500">
                  {selected.city ?? "Elsewhere"} · added by {selected.addedBy}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div
                  className="flex overflow-hidden rounded-full border text-xs"
                  role="group"
                  aria-label="Want or been"
                >
                  {(["want", "been"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatus(st)}
                      aria-pressed={selected.status === st}
                      className="px-2.5 py-1 capitalize aria-pressed:bg-neutral-900 aria-pressed:text-white dark:aria-pressed:bg-white dark:aria-pressed:text-neutral-900"
                    >
                      {st}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => select(null)}
                  aria-label="Close"
                  className="px-1 text-neutral-500"
                >
                  ✕
                </button>
              </div>
            </div>

            {editingNote ? (
              <form action={saveNote} className="mt-2 flex flex-col gap-2 text-sm">
                <label className="flex flex-col gap-0.5">
                  <span className="text-xs text-neutral-500">Via (who or what recommended it)</span>
                  <input
                    name="via"
                    defaultValue={selected.via ?? ""}
                    maxLength={200}
                    className="rounded-md border border-neutral-300 px-2 py-1 text-base dark:border-neutral-700 dark:bg-neutral-950"
                  />
                </label>
                <label className="flex flex-col gap-0.5">
                  <span className="text-xs text-neutral-500">Why</span>
                  <textarea
                    name="why"
                    defaultValue={selected.why ?? ""}
                    maxLength={2000}
                    rows={2}
                    className="rounded-md border border-neutral-300 px-2 py-1 text-base dark:border-neutral-700 dark:bg-neutral-950"
                  />
                </label>
                <div className="flex gap-3">
                  <button className="rounded-md bg-neutral-900 px-3 py-1 text-white dark:bg-white dark:text-neutral-900">
                    Save note
                  </button>
                  <button type="button" onClick={() => setEditingNote(false)} className="underline">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                {(selected.via || selected.why) && (
                  <p className="whitespace-pre-line">
                    {selected.via && <span>via {selected.via}</span>}
                    {selected.via && selected.why && " · "}
                    {selected.why}
                  </p>
                )}
                <button onClick={() => setEditingNote(true)} className="text-xs underline">
                  {selected.via || selected.why ? "Edit note" : "Add a note"}
                </button>
              </div>
            )}

            <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Category">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(selected.category === c ? null : c)}
                  aria-pressed={selected.category === c}
                  className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs aria-pressed:border-neutral-900 aria-pressed:bg-neutral-900 aria-pressed:text-white dark:aria-pressed:border-white dark:aria-pressed:bg-white dark:aria-pressed:text-neutral-900"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: CATEGORY_COLOR[c] }}
                    aria-hidden
                  />
                  {CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>

            {trips.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                {trips
                  .filter((t) => selected.tripIds.includes(t.id))
                  .map((t) => (
                    <Link
                      key={t.id}
                      href={`/trips/${t.id}`}
                      className="rounded-full bg-neutral-100 px-2.5 py-1 dark:bg-neutral-800"
                    >
                      In {t.name}
                    </Link>
                  ))}
                {trips.some((t) => !selected.tripIds.includes(t.id)) && (
                  <select
                    value=""
                    onChange={(e) => e.target.value && addSelectedToTrip(e.target.value)}
                    aria-label={`Add ${selected.name} to a trip`}
                    className="rounded-full border border-neutral-300 bg-transparent px-2 py-1 dark:border-neutral-700"
                  >
                    <option value="">Add to trip…</option>
                    {trips
                      .filter((t) => !selected.tripIds.includes(t.id))
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                )}
              </div>
            )}

            <div className="mt-2 flex items-center gap-3 text-sm">
              {mapboxToken && (
                <button onClick={() => setMoving((m) => !m)} className="underline">
                  {moving ? "Done moving" : "Move pin"}
                </button>
              )}
              {moving && <span className="text-xs text-neutral-500">Drag the black pin.</span>}
              {selected.moved && !moving && (
                <span className="text-xs text-neutral-500">Pin moved by us</span>
              )}
            </div>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto px-4 py-3" role="group" aria-label="City">
        <CityChip label="All" count={saves.length} active={!city} onClick={() => setCity(null)} />
        {cities.map(([c, n]) => (
          <CityChip key={c} label={c} count={n} active={city === c} onClick={() => setCity(c)} />
        ))}
      </div>

      <ul className="flex flex-col divide-y divide-neutral-200 px-4 dark:divide-neutral-800">
        {visible.map((s) => (
          <li key={s.id}>
            <button
              onClick={() => select(s.id)}
              aria-current={s.id === selectedId}
              className="flex w-full items-center gap-3 py-2 text-left aria-[current=true]:font-semibold"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: s.category ? CATEGORY_COLOR[s.category] : UNSORTED_COLOR }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate">{s.name}</span>
              <span className="shrink-0 text-xs font-normal text-neutral-500">
                {s.category ? CATEGORY_LABEL[s.category] : "Unsorted"}
                {s.status === "been" ? " · been" : ""}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CityChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="shrink-0 rounded-full border px-3 py-1 text-sm aria-pressed:border-neutral-900 aria-pressed:bg-neutral-900 aria-pressed:text-white dark:aria-pressed:border-white dark:aria-pressed:bg-white dark:aria-pressed:text-neutral-900"
    >
      {label} <span className="opacity-60">{count}</span>
    </button>
  );
}
