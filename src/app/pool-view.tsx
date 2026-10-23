"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useTransition } from "react";

import { updateSave } from "./actions";
import {
  CATEGORIES,
  CATEGORY_COLOR,
  CATEGORY_LABEL,
  UNSORTED_COLOR,
  type Category,
  type PoolSave,
} from "./pool-types";

// mapbox-gl touches window; load it only in the browser, and only here.
const PoolMap = dynamic(() => import("./pool-map"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-neutral-100 dark:bg-neutral-900" />,
});

export default function PoolView({
  initialSaves,
  mapboxToken,
}: {
  initialSaves: PoolSave[];
  mapboxToken: string | null;
}) {
  const [saves, setSaves] = useState(initialSaves);
  const [city, setCity] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
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
          <div className="absolute inset-x-2 bottom-2 rounded-lg bg-white p-3 shadow-lg dark:bg-neutral-900">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{selected.name}</p>
                <p className="text-xs text-neutral-500">
                  {selected.city ?? "Elsewhere"} · added by {selected.addedBy}
                </p>
              </div>
              <button
                onClick={() => select(null)}
                aria-label="Close"
                className="px-1 text-neutral-500"
              >
                ✕
              </button>
            </div>

            {(selected.via || selected.why) && (
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                {selected.via && <span>via {selected.via}</span>}
                {selected.via && selected.why && " · "}
                {selected.why}
              </p>
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
