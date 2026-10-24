"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { CATEGORY_COLOR, CATEGORY_LABEL, UNSORTED_COLOR } from "../../pool-types";
import { formatDay, formatShort } from "../dates";
import type { TripItem } from "./trip-view";

// The days of a trip as columns. On a laptop: the Maybe shelf and every day
// side by side, and a place is dragged from one to another. On a phone: the
// day picked in the chips above the map, then the Maybe shelf under it, and a
// place is moved with the pill on its row.
type Day = { day: string; cities: string[] };

const FINE_POINTER = "(hover: hover) and (pointer: fine)";
const subscribe = (cb: () => void) => {
  const m = window.matchMedia(FINE_POINTER);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

export default function DayBoard({
  days,
  items,
  cityOrder,
  focusDay,
  selectedId,
  onMove,
  onRemove,
}: {
  days: Day[];
  items: TripItem[];
  cityOrder: string[];
  focusDay: string | null;
  selectedId: string | null;
  onMove: (item: TripItem, day: string | null) => void;
  onRemove: (item: TripItem) => void;
}) {
  const canDrag = useSyncExternalStore(subscribe, () => window.matchMedia(FINE_POINTER).matches, () => false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  // On a phone only one day shows: the selected pin's day, else the chip's.
  const selectedDay = items.find((i) => i.id === selectedId)?.day ?? null;
  const shown = [selectedDay, focusDay].find((d) => d && days.some((x) => x.day === d)) ?? days[0]?.day;

  useEffect(() => {
    if (selectedId)
      document.getElementById(`item-${selectedId}`)?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [selectedId]);

  // Shelf grouped by city, the trip's own cities first in leg order.
  const shelf = useMemo(() => {
    const groups = new Map<string, TripItem[]>();
    for (const i of items.filter((i) => !i.day)) {
      const c = i.city ?? "Elsewhere";
      groups.set(c, [...(groups.get(c) ?? []), i]);
    }
    const rank = (c: string) => (cityOrder.includes(c) ? cityOrder.indexOf(c) : cityOrder.length);
    return [...groups].sort(([a, ai], [b, bi]) => rank(a) - rank(b) || bi.length - ai.length);
  }, [items, cityOrder]);
  const shelfCount = shelf.reduce((n, [, g]) => n + g.length, 0);

  const rowProps = {
    days,
    selectedId,
    canDrag,
    dragging: dragId,
    onDragStart: setDragId,
    onDragEnd: () => {
      setDragId(null);
      setOver(null);
    },
    onMove,
    onRemove,
  };

  function dropProps(key: string, day: string | null) {
    return {
      over: over === key,
      onDragOver: (e: React.DragEvent) => {
        if (!dragId) return;
        e.preventDefault();
        if (over !== key) setOver(key);
      },
      onDragLeave: (e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(null);
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        const item = items.find((i) => i.id === dragId);
        setDragId(null);
        setOver(null);
        if (item && item.day !== day) onMove(item, day);
      },
    };
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[17px] font-semibold">Days</h2>

      {days.length === 0 && (
        <p className="text-[15px] text-secondary">
          No days yet. Give a city its dates below and its days appear here.
        </p>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:overflow-x-auto lg:pb-3">
        {days.map(({ day, cities }) => {
          const onDay = items.filter((i) => i.day === day);
          return (
            <Column
              key={day}
              className={day === shown ? "" : "max-lg:hidden"}
              title={formatDay(day)}
              sub={cities.join(" → ")}
              count={onDay.length}
              empty={
                <>
                  <span className="lg:hidden">Nothing planned. Move a place here from Maybe.</span>
                  <span className="max-lg:hidden">Drag places here</span>
                </>
              }
              {...dropProps(day, day)}
            >
              {onDay.map((i) => (
                <ItemRow key={i.id} item={i} {...rowProps} />
              ))}
            </Column>
          );
        })}

        <Column
          className="max-lg:order-last lg:order-first"
          title="Maybe"
          count={shelfCount}
          empty="Nothing waiting. Add places to this trip from the pool."
          {...dropProps("maybe", null)}
        >
          {shelf.map(([city, group]) => (
            <li key={city} className="list-none">
              <h4 className="mx-4 pt-3 pb-1 text-[13px] text-secondary">
                <span className="font-semibold">{city}</span> <span className="tabular-nums">{group.length}</span>
              </h4>
              <ul>
                {group.map((i) => (
                  <ItemRow key={i.id} item={i} {...rowProps} />
                ))}
              </ul>
            </li>
          ))}
        </Column>
      </div>
    </section>
  );
}

function Column({
  title,
  sub,
  count,
  empty,
  over,
  className = "",
  children,
  ...drop
}: {
  title: string;
  sub?: string;
  count: number;
  empty: React.ReactNode;
  over: boolean;
  className?: string;
  children: React.ReactNode;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  return (
    <div
      {...drop}
      data-over={over}
      className={`card flex flex-col rounded-card transition-shadow data-[over=true]:ring-2 data-[over=true]:ring-accent lg:max-h-[min(70dvh,40rem)] lg:w-80 lg:shrink-0 ${className}`}
    >
      <div className="flex shrink-0 items-baseline justify-between gap-3 px-4 pt-3 pb-1">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold">{title}</h3>
          {sub && <p className="truncate text-[13px] text-secondary">{sub}</p>}
        </div>
        <span className="text-[15px] text-secondary tabular-nums">{count}</span>
      </div>
      {count === 0 ? (
        <p className="px-4 pt-2 pb-4 text-[15px] text-secondary lg:min-h-16">{empty}</p>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto pb-2">{children}</ul>
      )}
    </div>
  );
}

function ItemRow({
  item,
  days,
  selectedId,
  canDrag,
  dragging,
  onDragStart,
  onDragEnd,
  onMove,
  onRemove,
}: {
  item: TripItem;
  days: Day[];
  selectedId: string | null;
  canDrag: boolean;
  dragging: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onMove: (item: TripItem, day: string | null) => void;
  onRemove: (item: TripItem) => void;
}) {
  // Days in this place's city first: they are almost always the right ones.
  const ordered = [
    ...days.filter((d) => item.city && d.cities.includes(item.city)),
    ...days.filter((d) => !item.city || !d.cities.includes(item.city)),
  ];
  // On a laptop the controls float over the end of the row and appear on
  // hover or focus, so names get the full width; on a phone they are always there.
  const quiet =
    "lg:absolute lg:inset-y-0 lg:right-0 lg:pl-10 lg:opacity-0 lg:[--fade:#f3f3f8] lg:dark:[--fade:#2e2e31] lg:bg-[linear-gradient(to_left,var(--fade)_72%,transparent)] lg:group-hover:opacity-100 lg:group-focus-within:opacity-100";

  return (
    <li
      id={`item-${item.id}`}
      aria-current={item.id === selectedId}
      draggable={canDrag}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", item.id);
        onDragStart(item.id);
      }}
      onDragEnd={onDragEnd}
      className={`group mx-4 border-t border-separator first:border-t-0 ${
        dragging === item.id ? "opacity-40" : ""
      } ${canDrag ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <div className="relative flex min-h-14 items-center gap-3 lg:min-h-12">
        <span
          className="dot h-3 w-3 shrink-0 rounded-full"
          style={{ "--dot": item.category ? CATEGORY_COLOR[item.category] : UNSORTED_COLOR } as React.CSSProperties}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] leading-tight group-aria-[current=true]:font-semibold group-aria-[current=true]:text-accent lg:text-[15px]">
            {item.name}
          </p>
          <p className="truncate text-[15px] text-secondary lg:text-[13px]">
            {[item.category ? CATEGORY_LABEL[item.category] : "Unsorted", item.city].filter(Boolean).join(" · ")}
          </p>
        </div>

        <div className={`flex shrink-0 items-center gap-2 ${quiet}`}>
        <span
          className={`control relative inline-flex h-8 shrink-0 items-center gap-1 rounded-full pr-2 pl-3 text-[13px] font-medium text-accent has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent`}
        >
          {item.day ? formatShort(item.day) : "Maybe"}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 9l6 6 6-6" />
          </svg>
          <select
            value={item.day ?? ""}
            onChange={(e) => onMove(item, e.target.value || null)}
            aria-label={`Day for ${item.name}`}
            className="absolute inset-0 w-full cursor-pointer opacity-0 focus-visible:outline-none"
          >
            <option value="">Maybe</option>
            {ordered.map((d) => (
              <option key={d.day} value={d.day}>
                {formatDay(d.day)} · {d.cities.join("/")}
              </option>
            ))}
          </select>
        </span>

        <button
          type="button"
          onClick={() => onRemove(item)}
          aria-label={`Remove ${item.name} from trip`}
          className={`grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full control text-secondary`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        </div>
      </div>
    </li>
  );
}
