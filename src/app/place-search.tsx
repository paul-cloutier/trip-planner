"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import type { OsmPlace } from "@/lib/photon";

import { CATEGORY_LABEL, type PoolSave } from "./pool-types";
import { addPlace, searchPlaces } from "./search-actions";

type Near = { lat: number; lng: number } | undefined;

export default function PlaceSearch({
  near,
  onAdded,
  onOpenChange,
}: {
  near: Near;
  onAdded: (save: PoolSave, existed: boolean) => void;
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

  return (
    <div>
      <label className="relative flex h-10 items-center rounded-[10px] bg-fill px-2.5">
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
          placeholder={near ? "Find a place to save, near here" : "Find a place to save"}
          aria-label="Find a place to save"
          className="min-w-0 flex-1 bg-transparent pl-2 text-[17px] outline-none placeholder:text-secondary"
        />
      </label>
      {open && (
        <div className="mt-2">
          {status === "error" && (
            <p className="py-3 text-[15px] text-danger">Search didn&apos;t work. Try again.</p>
          )}
          {status !== "error" && results.length === 0 && (
            <p className="py-3 text-[15px] text-secondary">
              {status === "searching" ? "Searching…" : "No places found."}
            </p>
          )}
          <ul>
            {results.map((r) => (
              <li key={`${r.osmType}${r.osmId}`} className="border-b border-separator">
                <button
                  onClick={() => add(r)}
                  disabled={adding}
                  className="flex min-h-14 w-full flex-col items-start justify-center py-2 text-left disabled:opacity-50"
                >
                  <span className="text-[17px]">{r.name}</span>
                  <span className="text-[15px] text-secondary">
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
