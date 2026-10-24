"use client";

import { useOptimistic, useState, useTransition } from "react";

import { deleteLeg, saveLeg } from "../actions";
import {
  formatLong,
  formatSpan,
  monthLabel,
  monthOf,
  monthWeeks,
  shiftMonth,
  thisMonth,
} from "../dates";
import type { TripLeg } from "./trip-view";

// Cities and dates, painted on a calendar. Pick a city (its date chip), then
// drag across days to set its stay. Grab either end of the stay to stretch it.
// Tapping works too: tap the first day, then the last, which also lets a stay
// cross months. A new city waits in the last row for its name and dates.
type Range = readonly [string, string];
type LegChange = { id: string; city: string; startsOn: string | null; endsOn: string | null };
type Drag = { anchor: string; cur: string };

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const sorted = (a: string, b: string): Range => (a <= b ? [a, b] : [b, a]);
const within = (d: string, r: Range | null) => !!r && d >= r[0] && d <= r[1];
const legRange = (l: TripLeg): Range | null => (l.startsOn && l.endsOn ? [l.startsOn, l.endsOn] : null);

export default function LegCalendar({
  tripId,
  legs,
  cityOptions,
  onError,
}: {
  tripId: string;
  legs: TripLeg[];
  cityOptions: string[];
  onError: (message: string | null) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [optimisticLegs, applyLeg] = useOptimistic(legs, (all, c: LegChange | { id: string; removed: true }) =>
    "removed" in c ? all.filter((l) => l.id !== c.id) : all.map((l) => (l.id === c.id ? { ...l, ...c } : l)),
  );

  const [month, setMonth] = useState(() => {
    const first = legs.flatMap((l) => (l.startsOn ? [l.startsOn] : [])).sort()[0];
    return first ? monthOf(first) : thisMonth();
  });
  const [chosen, setChosen] = useState<string>(legs[0]?.id ?? "new");
  const [draft, setDraft] = useState<Range | null>(null);
  const [draftCity, setDraftCity] = useState("");
  const [anchor, setAnchor] = useState<string | null>(null);
  const [drag, setDrag] = useState<(Drag & { grab: boolean }) | null>(null);

  // The leg being painted: derived, so a removed leg never leaves a stale pick.
  const target = optimisticLegs.some((l) => l.id === chosen) ? chosen : (optimisticLegs[0]?.id ?? "new");
  const targetLeg = optimisticLegs.find((l) => l.id === target);
  const targetRange = targetLeg ? legRange(targetLeg) : draft;
  const preview = drag ? sorted(drag.anchor, drag.cur) : anchor ? ([anchor, anchor] as const) : null;
  const painted = preview ?? targetRange;

  function save(input: { legId?: string; city: string; startsOn: string | null; endsOn: string | null }) {
    onError(null);
    startTransition(async () => {
      if (input.legId) applyLeg({ id: input.legId, city: input.city, startsOn: input.startsOn, endsOn: input.endsOn });
      const result = await saveLeg({ tripId, ...input });
      if (!result.ok) onError("Couldn't save that city. Check the dates.");
      else if (!input.legId) {
        setDraft(null);
        setDraftCity("");
      }
    });
  }

  function remove(leg: TripLeg) {
    onError(null);
    startTransition(async () => {
      applyLeg({ id: leg.id, removed: true });
      const result = await deleteLeg({ tripId, legId: leg.id });
      if (!result.ok) onError("Couldn't remove that city.");
    });
  }

  function commit(a: string, b: string) {
    const [startsOn, endsOn] = sorted(a, b);
    if (!targetLeg) return setDraft([startsOn, endsOn]);
    if (targetLeg.startsOn === startsOn && targetLeg.endsOn === endsOn) return;
    save({ legId: targetLeg.id, city: targetLeg.city, startsOn, endsOn });
  }

  const dayAt = (e: React.PointerEvent) =>
    document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-day]")?.dataset.day ?? null;

  function down(e: React.PointerEvent<HTMLDivElement>) {
    const d = dayAt(e);
    if (!d || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const r = anchor ? null : targetRange;
    if (anchor) setDrag({ anchor, cur: d, grab: false });
    else if (r && d === r[0]) setDrag({ anchor: r[1], cur: d, grab: true });
    else if (r && d === r[1]) setDrag({ anchor: r[0], cur: d, grab: true });
    else setDrag({ anchor: d, cur: d, grab: false });
  }

  function move(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    const d = dayAt(e);
    if (d && d !== drag.cur) setDrag({ ...drag, cur: d });
  }

  function up() {
    if (!drag) return;
    const { anchor: a, cur: c, grab } = drag;
    setDrag(null);
    if (anchor) {
      setAnchor(null);
      commit(a, c);
    } else if (a === c && !grab) setAnchor(a);
    else commit(a, c);
  }

  // A keyboard press arrives as a click with no pointer (detail 0); pointer
  // presses were already handled above.
  function key(day: string, e: React.MouseEvent) {
    if (e.detail !== 0) return;
    if (anchor) {
      commit(anchor, day);
      setAnchor(null);
    } else setAnchor(day);
  }

  function choose(id: string, range: Range | null) {
    setChosen(id);
    setAnchor(null);
    if (range) setMonth(monthOf(range[0]));
  }

  const name = targetLeg?.city ?? (draftCity.trim() || "the new city");
  const hint = anchor
    ? "Now tap the last day."
    : `Drag across days to set ${name}'s dates, or tap the first and last day.`;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[17px] font-semibold">Cities and dates</h2>
      <datalist id="trip-cities">
        {cityOptions.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:items-start">
        <div className="card rounded-card p-3">
          <div className="flex items-center justify-between pb-1 pl-1">
            <h3 className="text-[17px] font-semibold" aria-live="polite">
              {monthLabel(month)}
            </h3>
            <div className="flex gap-2">
              <MonthButton label="Previous month" dir={-1} onClick={() => setMonth(shiftMonth(month, -1))} />
              <MonthButton label="Next month" dir={1} onClick={() => setMonth(shiftMonth(month, 1))} />
            </div>
          </div>

          <div className="grid grid-cols-7 pb-1 text-center text-[13px] text-secondary" aria-hidden>
            {WEEKDAYS.map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </div>

          <div
            className="touch-none select-none"
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={() => setDrag(null)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setAnchor(null);
                setDrag(null);
              }
            }}
          >
            {monthWeeks(month).map((week, w) => (
              <div key={w} className="grid grid-cols-7">
                {week.map((day, col) => {
                  if (!day) return <span key={col} />;
                  const mine = within(day, painted);
                  const other = mine
                    ? undefined
                    : optimisticLegs.find((l) => l.id !== target && within(day, legRange(l)));
                  const band = mine ? painted : other ? legRange(other) : null;
                  const capStart = !!band && (day === band[0] || col === 0);
                  const capEnd = !!band && (day === band[1] || col === 6);
                  return (
                    <button
                      key={day}
                      type="button"
                      data-day={day}
                      aria-label={formatLong(day)}
                      aria-pressed={mine}
                      onClick={(e) => key(day, e)}
                      className="group relative flex h-11 items-center justify-center text-[15px] tabular-nums"
                    >
                      {band && (
                        <span
                          aria-hidden
                          className={`absolute inset-y-1 ${mine ? "pressed" : "bg-accent-tint"} ${
                            capStart ? "rounded-l-full" : ""
                          } ${capEnd ? "rounded-r-full" : ""}`}
                          style={{ left: capStart ? 2 : 0, right: capEnd ? 2 : 0 }}
                        />
                      )}
                      {!band && (
                        <span
                          aria-hidden
                          className="absolute inset-1 rounded-full group-hover:bg-grouped group-active:bg-fill"
                        />
                      )}
                      <span className={`relative ${mine ? "font-semibold text-white" : other ? "font-medium text-accent" : ""}`}>
                        {Number(day.slice(8))}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <p className="px-1 pt-2 text-[13px] text-secondary" aria-live="polite">
            {hint}
          </p>
        </div>

        <div className="card rounded-card">
          {optimisticLegs.map((leg) => {
            const range = legRange(leg);
            return (
              <div key={leg.id} className="mx-4 flex min-h-14 items-center gap-2 border-t border-separator first:border-t-0">
                <input
                  key={`${leg.id}-${leg.city}`}
                  defaultValue={leg.city}
                  list="trip-cities"
                  aria-label="City"
                  maxLength={80}
                  onFocus={() => choose(leg.id, range)}
                  onBlur={(e) => {
                    const city = e.currentTarget.value.trim();
                    if (!city) e.currentTarget.value = leg.city;
                    else if (city !== leg.city) save({ legId: leg.id, city, startsOn: leg.startsOn, endsOn: leg.endsOn });
                  }}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                  className="min-w-0 flex-1 bg-transparent text-[17px] outline-none focus-visible:outline-none"
                />
                <DateChip
                  active={target === leg.id}
                  label={range ? formatSpan(...range) : "Set dates"}
                  onClick={() => choose(leg.id, range)}
                />
                <button
                  type="button"
                  onClick={() => remove(leg)}
                  aria-label={`Remove ${leg.city}`}
                  className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full control text-secondary"
                >
                  <Cross />
                </button>
              </div>
            );
          })}

          <form
            className="mx-4 flex min-h-14 items-center gap-2 border-t border-separator first:border-t-0"
            onSubmit={(e) => {
              e.preventDefault();
              const city = draftCity.trim();
              if (city) save({ city, startsOn: draft?.[0] ?? null, endsOn: draft?.[1] ?? null });
            }}
          >
            <input
              value={draftCity}
              onChange={(e) => setDraftCity(e.target.value)}
              onFocus={() => choose("new", draft)}
              list="trip-cities"
              placeholder="Add a city"
              aria-label="New city"
              maxLength={80}
              className="min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-secondary focus-visible:outline-none"
            />
            <DateChip
              active={target === "new"}
              label={draft ? formatSpan(...draft) : "Set dates"}
              onClick={() => choose("new", draft)}
            />
            <button
              disabled={pending || !draftCity.trim()}
              className="shrink-0 px-1 text-[17px] text-accent disabled:text-secondary disabled:opacity-60"
            >
              Add
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function DateChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="h-9 shrink-0 rounded-full px-3.5 text-[15px] font-medium tabular-nums control aria-pressed:pressed"
    >
      {label}
    </button>
  );
}

function MonthButton({ label, dir, onClick }: { label: string; dir: 1 | -1; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-[30px] w-[30px] place-items-center rounded-full control text-accent"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={dir === 1 ? "M9 5l7 7-7 7" : "M15 5l-7 7 7 7"} />
      </svg>
    </button>
  );
}

function Cross() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
