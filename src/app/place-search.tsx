"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import type { OsmPlace } from "@/lib/photon";

import { CATEGORY_LABEL, type PoolSave } from "./pool-types";
import { addPlace, searchPlaces } from "./search-actions";

type Near = { lat: number; lng: number } | undefined;

export default function PlaceSearch({
  near,
  onAdded,
}: {
  near: Near;
  onAdded: (save: PoolSave, existed: boolean) => void;
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

  return (
    <div className="relative px-4 pt-3">
      <input
        type="search"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder={near ? "Find a place to save, near here" : "Find a place to save"}
        aria-label="Find a place to save"
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base dark:border-neutral-700 dark:bg-neutral-950"
      />
      {open && (
        <div className="absolute inset-x-4 top-full z-10 mt-1 rounded-md border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          {status === "error" && (
            <p className="px-3 py-2 text-sm text-red-600">Search didn&apos;t work. Try again.</p>
          )}
          {status !== "error" && results.length === 0 && (
            <p className="px-3 py-2 text-sm text-neutral-500">
              {status === "searching" ? "Searching…" : "No places found."}
            </p>
          )}
          <ul className="max-h-72 overflow-y-auto">
            {results.map((r) => (
              <li key={`${r.osmType}${r.osmId}`}>
                <button
                  onClick={() => add(r)}
                  disabled={adding}
                  className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-800"
                >
                  <span className="text-sm font-medium">{r.name}</span>
                  <span className="text-xs text-neutral-500">
                    {[r.category ? CATEGORY_LABEL[r.category] : r.tag?.split("=")[1], r.address ?? r.city, r.country]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="border-t border-neutral-200 px-3 py-1.5 text-[11px] text-neutral-500 dark:border-neutral-800">
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
