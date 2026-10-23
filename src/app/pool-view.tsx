"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import Link from "next/link";

import { updateSave } from "./actions";
import PlaceSearch from "./place-search";
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
  loading: () => <div className="h-full w-full bg-grouped" />,
});

// The phone sheet rests at one of three heights. Peek shows the title and the
// search field; half shows a handful of rows over the map; full is the list.
type Detent = "peek" | "half" | "full";
const PEEK = 124;
const TOP_GAP = 48;

function detentHeight(detent: Detent, viewport: number) {
  if (detent === "peek") return PEEK;
  if (detent === "half") return Math.round(viewport * 0.5);
  return viewport - TOP_GAP;
}

type Here =
  | { status: "off" | "asking" | "denied" | "unavailable" }
  | { status: "on"; lat: number; lng: number };

// Straight-line distance in metres. Good enough to rank what is near.
function metresBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(h));
}

function formatDistance(m: number) {
  if (m < 1000) return `${Math.max(10, Math.round(m / 10) * 10)} m`;
  if (m < 10000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m / 1000)} km`;
}

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return desktop;
}

export default function PoolView({
  title,
  initialSaves,
  trips,
  mapboxToken,
  nav,
  footer,
}: {
  title: string;
  initialSaves: PoolSave[];
  trips: TripOption[];
  mapboxToken: string | null;
  nav: React.ReactNode;
  footer: React.ReactNode;
}) {
  const [saves, setSaves] = useState(initialSaves);
  const [city, setCity] = useState<string | null>(null);
  const [category, setCategoryFilter] = useState<Category | "unsorted" | null>(null);
  const [status, setStatusFilter] = useState<PoolSave["status"] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [searching, setSearching] = useState(false);
  const [here, setHere] = useState<Here>({ status: "off" });
  const [detent, setDetent] = useState<Detent>("half");
  const [viewport, setViewport] = useState(800);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const desktop = useIsDesktop();

  useEffect(() => {
    const update = () => setViewport(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Location only while Nearby is on; the watch stops when it is turned off.
  const watching = here.status === "asking" || here.status === "on";
  useEffect(() => {
    if (!watching) return;
    const id = navigator.geolocation.watchPosition(
      (p) => setHere({ status: "on", lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => setHere({ status: e.code === e.PERMISSION_DENIED ? "denied" : "unavailable" }),
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [watching]);

  function toggleNearby() {
    if (watching) setHere({ status: "off" });
    else if (!("geolocation" in navigator)) setHere({ status: "unavailable" });
    else setHere({ status: "asking" });
  }

  // Category and want/been narrow everything; city counts follow them.
  const matching = useMemo(
    () =>
      saves.filter(
        (s) =>
          (!category || (category === "unsorted" ? !s.category : s.category === category)) &&
          (!status || s.status === status),
      ),
    [saves, category, status],
  );

  const cities = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of matching) {
      const c = s.city ?? "Elsewhere";
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    if (city && !counts.has(city)) counts.set(city, 0);
    return [...counts].sort((a, b) => b[1] - a[1]);
  }, [matching, city]);

  const inCity = useMemo(
    () => (city ? matching.filter((s) => (s.city ?? "Elsewhere") === city) : matching),
    [matching, city],
  );

  // With a position, rows carry a distance and the nearest come first;
  // otherwise they stay newest first, as the server sent them.
  const rows = useMemo(() => {
    if (here.status !== "on") return inCity.map((save) => ({ save, metres: null }));
    return inCity
      .map((save) => ({ save, metres: metresBetween(here, save) }))
      .sort((a, b) => a.metres - b.metres);
  }, [inCity, here]);

  const filtered = Boolean(category || status);
  const selected = saves.find((s) => s.id === selectedId) ?? null;
  const selectedMetres = selected && here.status === "on" ? metresBetween(here, selected) : null;

  // With a city picked, search near the middle of its places.
  const near = useMemo(() => {
    if (!city || inCity.length === 0) return undefined;
    const lat = inCity.reduce((n, s) => n + s.lat, 0) / inCity.length;
    const lng = inCity.reduce((n, s) => n + s.lng, 0) / inCity.length;
    return { lat, lng };
  }, [city, inCity]);

  function placeAdded(save: PoolSave, existed: boolean) {
    if (!existed) setSaves((all) => [save, ...all]);
    if (city && (save.city ?? "Elsewhere") !== city) setCity(null);
    select(save.id);
  }

  function select(id: string | null) {
    setSelectedId(id);
    setMoving(false);
    setEditingNote(false);
    if (id && detent === "peek") setDetent("half");
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

  const onSearchOpen = useCallback((open: boolean) => setSearching(open), []);

  return (
    <div className="relative h-dvh overflow-hidden bg-grouped lg:flex">
      <div className="absolute inset-0 lg:static lg:order-2 lg:flex-1">
        {mapboxToken ? (
          <PoolMap
            token={mapboxToken}
            saves={inCity}
            selectedId={selectedId}
            hoveredId={hoveredId}
            bottomInset={desktop ? 0 : detentHeight("half", viewport)}
            moving={moving}
            onSelect={select}
            onMove={movePin}
          />
        ) : (
          <div className="flex h-full items-start justify-center px-6 pt-24 text-center text-[15px] text-secondary lg:items-center lg:pt-0">
            Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to .env.local to see the map.
          </div>
        )}
      </div>

      <Sheet
        detent={detent}
        onDetent={setDetent}
        header={
          selected ? null : (
            <div className="px-4 pb-3">
              <div className="flex items-baseline justify-between gap-3 pb-2.5">
                <h1 className="truncate text-[22px] font-bold tracking-[-0.01em]">{title}</h1>
                {nav}
              </div>
              <PlaceSearch near={near} onAdded={placeAdded} onOpenChange={onSearchOpen} />
            </div>
          )
        }
      >
        {selected ? (
          <PlaceDetail
            save={selected}
            metres={selectedMetres}
            trips={trips}
            canMove={Boolean(mapboxToken)}
            moving={moving}
            editingNote={editingNote}
            error={error}
            onClose={() => select(null)}
            onStatus={setStatus}
            onCategory={setCategory}
            onEditNote={setEditingNote}
            onSaveNote={saveNote}
            onAddToTrip={addSelectedToTrip}
            onToggleMove={() => setMoving((m) => !m)}
          />
        ) : searching ? null : (
          <>
            <div className="flex items-center gap-2 px-4 pb-2.5">
              <label className="relative inline-flex h-9 min-w-0 items-center rounded-full bg-fill pr-8 pl-3.5 text-[15px] font-semibold">
                <select
                  aria-label="City"
                  value={city ?? ""}
                  onChange={(e) => setCity(e.target.value || null)}
                  className="absolute inset-0 cursor-pointer appearance-none opacity-0"
                >
                  <option value="">All places · {matching.length}</option>
                  {cities.map(([c, n]) => (
                    <option key={c} value={c}>
                      {c} · {n}
                    </option>
                  ))}
                </select>
                <span className="truncate" aria-hidden>
                  {city ?? "All places"}
                </span>
                <span className="pl-1.5 font-normal text-secondary tabular-nums" aria-hidden>
                  {inCity.length}
                </span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="pointer-events-none absolute right-3 text-secondary"
                  aria-hidden
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </label>
            </div>

            <div
              className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] lg:flex-wrap"
              role="group"
              aria-label="Filter"
            >
              <Chip active={watching} onClick={toggleNearby}>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                  className="-ml-0.5"
                >
                  <path d="M21 3 3 10.5l7.5 3L13.5 21z" />
                </svg>
                {here.status === "asking" ? "Locating…" : "Nearby"}
              </Chip>
              {(["want", "been"] as const).map((st) => (
                <Chip
                  key={st}
                  active={status === st}
                  onClick={() => setStatusFilter(status === st ? null : st)}
                >
                  {st === "want" ? "Want" : "Been"}
                </Chip>
              ))}
              <span className="my-2 w-px shrink-0 bg-separator" aria-hidden />
              {CATEGORIES.map((c) => (
                <Chip
                  key={c}
                  color={CATEGORY_COLOR[c]}
                  active={category === c}
                  onClick={() => setCategoryFilter(category === c ? null : c)}
                >
                  {CATEGORY_LABEL[c]}
                </Chip>
              ))}
              <Chip
                color={UNSORTED_COLOR}
                active={category === "unsorted"}
                onClick={() => setCategoryFilter(category === "unsorted" ? null : "unsorted")}
              >
                Unsorted
              </Chip>
            </div>

            {(here.status === "denied" || here.status === "unavailable") && (
              <p className="px-4 pb-3 text-[15px] text-secondary" role="status">
                {here.status === "denied"
                  ? "Location is off for this site. Allow it in Settings to sort by distance."
                  : "Couldn't find where you are. Showing newest first."}
              </p>
            )}

            {saves.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-[17px] font-semibold">No places yet</p>
                <p className="pt-1 text-[15px] text-secondary">
                  Search above to save the first one.
                </p>
              </div>
            ) : rows.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-[17px] font-semibold">Nothing matches</p>
                {filtered && (
                  <button
                    onClick={() => {
                      setCategoryFilter(null);
                      setStatusFilter(null);
                    }}
                    className="pt-1 text-[15px] text-accent"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <ul className="border-t border-separator" onMouseLeave={() => setHoveredId(null)}>
                {rows.map(({ save: s, metres }) => (
                  <li key={s.id}>
                    <button
                      onClick={() => select(s.id)}
                      onMouseEnter={() => setHoveredId(s.id)}
                      onFocus={() => setHoveredId(s.id)}
                      onBlur={() => setHoveredId(null)}
                      className="flex w-full items-stretch text-left hover:bg-grouped focus-visible:bg-grouped focus-visible:outline-offset-[-2px] active:bg-fill"
                    >
                      <span className="flex w-10 shrink-0 items-center justify-center pl-1">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{
                            background: s.category ? CATEGORY_COLOR[s.category] : UNSORTED_COLOR,
                          }}
                          aria-hidden
                        />
                      </span>
                      <span className="flex min-h-14 min-w-0 flex-1 items-center gap-3 border-b border-separator py-2 pr-4 lg:min-h-12 lg:py-1.5">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[17px] leading-snug">{s.name}</span>
                          <span className="block truncate text-[15px] leading-snug text-secondary">
                            {[
                              s.category ? CATEGORY_LABEL[s.category] : "Unsorted",
                              s.status === "been" ? "Been" : null,
                              city ? null : (s.city ?? "Elsewhere"),
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </span>
                        {metres !== null && (
                          <span className="shrink-0 text-[15px] text-secondary tabular-nums">
                            {formatDistance(metres)}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex justify-center px-4 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              {footer}
            </div>
          </>
        )}
      </Sheet>
    </div>
  );
}

// On a phone, a bottom sheet dragged by its top edge between three heights.
// On a laptop, the same content as a fixed column beside the map. Resting
// positions are CSS, so the first paint is already in place; pixels only
// take over mid-drag.
const REST: Record<Detent, string> = {
  peek: `calc(100% - ${PEEK}px)`,
  half: "calc(100% - 50dvh)",
  full: "0px",
};

const HIDDEN: Record<Detent, string> = {
  peek: `calc(100dvh - ${TOP_GAP + PEEK}px)`,
  half: `calc(50dvh - ${TOP_GAP}px)`,
  full: "0px",
};

function Sheet({
  detent,
  onDetent,
  header,
  children,
}: {
  detent: Detent;
  onDetent: (d: Detent) => void;
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  const sheet = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; t: number; start: number } | null>(null);
  const order: Detent[] = ["peek", "half", "full"];

  function step() {
    onDetent(detent === "full" ? "half" : order[order.indexOf(detent) + 1]);
  }

  function onPointerDown(e: React.PointerEvent) {
    const el = sheet.current;
    if (!el || window.matchMedia("(min-width: 1024px)").matches) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // Let taps on the title's links and the search field through.
    if ((e.target as HTMLElement).closest("a, input, select, label, button:not([data-grabber])")) return;
    const shown = window.innerHeight - el.getBoundingClientRect().top;
    drag.current = { y: e.clientY, t: e.timeStamp, start: el.offsetHeight - shown };
    e.currentTarget.setPointerCapture(e.pointerId);
    el.style.setProperty("transition", "none");
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    const el = sheet.current;
    if (!d || !el) return;
    const y = Math.min(el.offsetHeight - PEEK, Math.max(0, d.start + e.clientY - d.y));
    el.style.setProperty("--sheet-y", `${y}px`);
  }

  function onPointerUp(e: React.PointerEvent) {
    const d = drag.current;
    const el = sheet.current;
    drag.current = null;
    if (!d || !el) return;
    el.style.removeProperty("transition");
    el.style.setProperty("--sheet-y", REST[detent]);
    const moved = e.clientY - d.y;
    if (Math.abs(moved) < 6) return step();
    const viewport = window.innerHeight;
    const shown = el.offsetHeight - (d.start + moved);
    let next = order.reduce((best, o) =>
      Math.abs(detentHeight(o, viewport) - shown) < Math.abs(detentHeight(best, viewport) - shown)
        ? o
        : best,
    );
    // A flick goes one step in its direction even when it stops short.
    const velocity = moved / Math.max(1, e.timeStamp - d.t);
    if (Math.abs(velocity) > 0.5 && next === detent) {
      next = order[Math.min(2, Math.max(0, order.indexOf(detent) + (velocity < 0 ? 1 : -1)))];
    }
    el.style.setProperty("--sheet-y", REST[next]);
    onDetent(next);
  }

  return (
    <div
      ref={sheet}
      className="fixed inset-x-0 bottom-0 z-10 flex h-[calc(100dvh-48px)] flex-col rounded-t-[14px] bg-background shadow-[var(--sheet-shadow)] max-lg:[transform:translateY(var(--sheet-y))] motion-safe:transition-transform motion-safe:duration-[420ms] motion-safe:ease-[cubic-bezier(0.32,0.72,0,1)] lg:static lg:order-1 lg:h-full lg:w-[400px] lg:shrink-0 lg:rounded-none lg:border-r lg:border-separator lg:shadow-none"
      style={{ "--sheet-y": REST[detent] } as React.CSSProperties}
    >
      <div
        className="shrink-0 touch-none select-none lg:touch-auto lg:select-auto"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <button
          type="button"
          data-grabber
          // Pointer taps are handled by the drag; this catches the keyboard.
          onClick={(e) => e.detail === 0 && step()}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") onDetent(detent === "peek" ? "half" : "full");
            if (e.key === "ArrowDown") onDetent(detent === "full" ? "half" : "peek");
          }}
          aria-label={`Resize sheet, now ${detent === "full" ? "expanded" : detent === "half" ? "half open" : "collapsed"}`}
          className="flex h-5 w-full items-center justify-center lg:hidden"
        >
          <span className="h-[5px] w-9 rounded-full bg-separator" />
        </button>
        <div className="lg:pt-4">{header}</div>
      </div>
      {/* Below full height part of the sheet sits off screen; pad the list by
          that much so its last rows can still scroll into view. */}
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain max-lg:pb-[var(--sheet-hidden)]"
        style={{ "--sheet-hidden": HIDDEN[detent] } as React.CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}

function Chip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="group flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-fill px-3.5 text-[15px] font-medium aria-pressed:bg-accent aria-pressed:text-white"
    >
      {color && (
        <span
          className="h-2.5 w-2.5 rounded-full ring-1 ring-white/70 group-aria-pressed:ring-[1.5px] group-aria-pressed:ring-white"
          style={{ background: color }}
          aria-hidden
        />
      )}
      {children}
    </button>
  );
}

function PlaceDetail({
  save,
  metres,
  trips,
  canMove,
  moving,
  editingNote,
  error,
  onClose,
  onStatus,
  onCategory,
  onEditNote,
  onSaveNote,
  onAddToTrip,
  onToggleMove,
}: {
  save: PoolSave;
  metres: number | null;
  trips: TripOption[];
  canMove: boolean;
  moving: boolean;
  editingNote: boolean;
  error: string | null;
  onClose: () => void;
  onStatus: (s: PoolSave["status"]) => void;
  onCategory: (c: Category | null) => void;
  onEditNote: (editing: boolean) => void;
  onSaveNote: (form: FormData) => void;
  onAddToTrip: (tripId: string) => void;
  onToggleMove: () => void;
}) {
  const inTrips = trips.filter((t) => save.tripIds.includes(t.id));
  const otherTrips = trips.filter((t) => !save.tripIds.includes(t.id));

  return (
    <div className="px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:pt-1">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 text-[22px] leading-tight font-bold tracking-[-0.01em]">
            {save.name}
          </h2>
          <p className="pt-0.5 text-[15px] text-secondary">
            {[
              save.category ? CATEGORY_LABEL[save.category] : "Unsorted",
              save.city ?? "Elsewhere",
              metres !== null ? formatDistance(metres) : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-fill text-secondary"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 rounded-[9px] bg-fill p-0.5" role="group" aria-label="Want or been">
        {(["want", "been"] as const).map((st) => (
          <button
            key={st}
            onClick={() => onStatus(st)}
            aria-pressed={save.status === st}
            className="h-8 rounded-[7px] text-[15px] font-medium aria-pressed:bg-background aria-pressed:font-semibold aria-pressed:shadow-[0_1px_3px_rgb(0_0_0/0.12)]"
          >
            {st === "want" ? "Want to go" : "Been"}
          </button>
        ))}
      </div>

      <section className="mt-5">
        <div className="flex items-baseline justify-between pb-1.5">
          <h3 className="text-[15px] font-semibold">Note</h3>
          {!editingNote && (
            <button onClick={() => onEditNote(true)} className="text-[15px] text-accent">
              {save.via || save.why ? "Edit" : "Add"}
            </button>
          )}
        </div>
        {editingNote ? (
          <form action={onSaveNote} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[13px] text-secondary">Via: who or what recommended it</span>
              <input
                name="via"
                defaultValue={save.via ?? ""}
                maxLength={200}
                className="h-11 rounded-[10px] bg-fill px-3 text-[17px] outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[13px] text-secondary">Why</span>
              <textarea
                name="why"
                defaultValue={save.why ?? ""}
                maxLength={2000}
                rows={3}
                className="rounded-[10px] bg-fill px-3 py-2.5 text-[17px] outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </label>
            <div className="flex gap-2">
              <button className="h-11 flex-1 rounded-[10px] bg-accent text-[17px] font-semibold text-white">
                Save
              </button>
              <button
                type="button"
                onClick={() => onEditNote(false)}
                className="h-11 flex-1 rounded-[10px] bg-fill text-[17px] text-accent"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-[10px] bg-grouped px-3.5 py-3 text-[17px]">
            <p>
              <span className="text-secondary">Added by </span>
              {save.addedBy}
              {save.via && (
                <>
                  <span className="text-secondary">, via </span>
                  {save.via}
                </>
              )}
            </p>
            {save.why ? (
              <p className="pt-1.5 whitespace-pre-line">{save.why}</p>
            ) : (
              <p className="pt-1.5 text-secondary">No why yet.</p>
            )}
          </div>
        )}
      </section>

      <section className="mt-5">
        <h3 className="pb-2 text-[15px] font-semibold">Category</h3>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Category">
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              color={CATEGORY_COLOR[c]}
              active={save.category === c}
              onClick={() => onCategory(save.category === c ? null : c)}
            >
              {CATEGORY_LABEL[c]}
            </Chip>
          ))}
        </div>
      </section>

      {trips.length > 0 && (
        <section className="mt-5">
          <h3 className="pb-2 text-[15px] font-semibold">Trips</h3>
          <div className="flex flex-wrap items-center gap-2">
            {inTrips.map((t) => (
              <Link
                key={t.id}
                href={`/trips/${t.id}`}
                className="flex h-9 items-center rounded-full bg-accent-tint px-3.5 text-[15px] font-medium text-accent"
              >
                In {t.name}
              </Link>
            ))}
            {otherTrips.length > 0 && (
              <label className="relative flex h-9 items-center rounded-full bg-fill px-3.5 text-[15px] font-medium text-accent">
                Add to trip
                <select
                  value=""
                  onChange={(e) => e.target.value && onAddToTrip(e.target.value)}
                  aria-label={`Add ${save.name} to a trip`}
                  className="absolute inset-0 cursor-pointer appearance-none opacity-0"
                >
                  <option value="">Add to trip</option>
                  {otherTrips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </section>
      )}

      {canMove && (
        <section className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <button onClick={onToggleMove} className="text-[17px] text-accent">
            {moving ? "Done moving" : "Move pin"}
          </button>
          <span className="text-[15px] text-secondary">
            {moving ? "Drag the blue pin to where it really is." : save.moved ? "Pin moved by us" : null}
          </span>
        </section>
      )}

      {error && (
        <p className="mt-4 text-[15px] text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
