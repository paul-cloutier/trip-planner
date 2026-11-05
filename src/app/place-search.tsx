"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import type { OsmPlace } from "@/lib/photon";

import { CATEGORY_COLOR, CATEGORY_LABEL, UNSORTED_COLOR, type PoolSave } from "./pool-types";
import { addPlace, searchPlaces } from "./search-actions";

type Near = { lat: number; lng: number } | undefined;

// Our own places that match, shown above new ones to add.
const MINE_LIMIT = 8;

// Lower case, accents dropped, so "cafe" finds "Café".
function fold(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export default function PlaceSearch({
  near,
  saves,
  onAdded,
  onPick,
  onOpenChange,
}: {
  near: Near;
  saves: PoolSave[];
  onAdded: (save: PoolSave, existed: boolean) => void;
  onPick: (save: PoolSave) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OsmPlace[]>([]);
  const [status, setStatus] = useState<"idle" | "searching" | "error">("idle");
  const [adding, startAdding] = useTransition();
  const latest = useRef(0);

  // Search as you type, once typing pauses. Older responses are ignored.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const request = ++latest.current;
    const timer = setTimeout(async () => {
      setStatus("searching");
      const res = await searchPlaces({ query: q, near });
      if (request !== latest.current) return;
      setStatus(res.ok ? "idle" : "error");
      setResults(res.ok ? res.results : []);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, near]);

  function onChange(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      latest.current++;
      setResults([]);
      setStatus("idle");
    }
  }

  function add(place: OsmPlace) {
    startAdding(async () => {
      const res = await addPlace({ osmType: place.osmType, osmId: place.osmId, query: query.trim(), near });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      onAdded(res.save, res.existed);
      onChange("");
    });
  }

  const open = query.trim().length >= 2;
  useEffect(() => onOpenChange(open), [open, onOpenChange]);

  // Name first, then our why and via, so "steak frites" finds the bistro.
  const mine = useMemo(() => {
    const q = fold(query.trim());
    if (q.length < 2) return [];
    const byName: PoolSave[] = [];
    const byNote: PoolSave[] = [];
    for (const s of saves) {
      const name = fold(s.name);
      if (name.includes(q)) byName.push(s);
      else if (fold(`${s.why ?? ""} ${s.via ?? ""}`).includes(q)) byNote.push(s);
    }
    byName.sort((a, b) => Number(!fold(a.name).startsWith(q)) - Number(!fold(b.name).startsWith(q)));
    return [...byName, ...byNote];
  }, [query, saves]);

  function pick(save: PoolSave) {
    onPick(save);
    onChange("");
  }

  return (
    <div>
      <label className="relative flex h-10 items-center rounded-control control px-2.5">
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          className="shrink-0 text-secondary"
          aria-hidden
        >
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m15.5 15.5 5 5" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search our places, or add one"
          aria-label="Search our places, or add one"
          className="min-w-0 flex-1 bg-transparent pl-2 text-[17px] outline-none placeholder:text-secondary"
        />
      </label>
      {open && (
        <div className="mt-2">
          {mine.length > 0 && (
            <section aria-label="Our places" className="pb-3">
              <h2 className="pt-2 pb-1 text-[13px] font-semibold text-secondary">
                Our places · {mine.length}
              </h2>
              <ul>
                {mine.slice(0, MINE_LIMIT).map((s) => (
                  <li key={s.id} className="border-b border-separator">
                    <button
                      onClick={() => pick(s)}
                      className="flex min-h-14 w-full items-center gap-3 py-2 text-left lg:min-h-11 lg:py-1"
                    >
                      <span
                        className="dot h-3 w-3 shrink-0 rounded-full"
                        style={
                          {
                            "--dot": s.category ? CATEGORY_COLOR[s.category] : UNSORTED_COLOR,
                          } as React.CSSProperties
                        }
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[17px] leading-snug lg:text-[15px]">
                          {s.name}
                        </span>
                        <span className="block truncate text-[15px] leading-snug text-secondary lg:text-[13px]">
                          {s.why ??
                            [s.category ? CATEGORY_LABEL[s.category] : "Unsorted", s.city ?? "Elsewhere"].join(
                              " · ",
                            )}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {mine.length > MINE_LIMIT && (
                <p className="pt-2 text-[13px] text-secondary">
                  {mine.length - MINE_LIMIT} more. Keep typing to narrow it down.
                </p>
              )}
            </section>
          )}
          <h2 className="pt-2 pb-1 text-[13px] font-semibold text-secondary">Add a new place</h2>
          {status === "error" && (
            <p className="py-3 text-[15px] text-danger">Search didn&apos;t work. Try again.</p>
          )}
          {status !== "error" && results.length === 0 && (
            <p className="py-3 text-[15px] text-secondary">
              {status === "searching" ? "Searching…" : "No new places found."}
            </p>
          )}
          <ul>
            {results.map((r) => (
              <li key={`${r.osmType}${r.osmId}`} className="border-b border-separator">
                <button
                  onClick={() => add(r)}
                  disabled={adding}
                  className="flex min-h-14 w-full flex-col items-start justify-center py-2 text-left disabled:opacity-50 lg:min-h-11 lg:py-1"
                >
                  <span className="text-[17px] lg:text-[15px]">{r.name}</span>
                  <span className="text-[15px] text-secondary lg:text-[13px]">
                    {[r.category ? CATEGORY_LABEL[r.category] : r.tag?.split("=")[1], r.address ?? r.city, r.country]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="py-2 text-[12px] text-secondary">
            Search by{" "}
            <a href="https://photon.komoot.io" target="_blank" rel="noreferrer" className="underline">
              Photon
            </a>{" "}
            · Data ©{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              OpenStreetMap contributors
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
