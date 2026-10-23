"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import type { FeatureCollection } from "geojson";
import mapboxgl from "mapbox-gl";
import { useEffect, useLayoutEffect, useRef } from "react";

import { CATEGORY_COLOR, UNSORTED_COLOR, type PoolSave } from "./pool-types";

type Props = {
  token: string;
  saves: PoolSave[];
  selectedId: string | null;
  moving: boolean;
  onSelect: (id: string | null) => void;
  onMove: (pin: { lat: number; lng: number }) => void;
};

const colorExpression = [
  "match",
  ["get", "category"],
  ...Object.entries(CATEGORY_COLOR).flat(),
  UNSORTED_COLOR,
] as unknown as mapboxgl.ExpressionSpecification;

function toGeoJSON(saves: PoolSave[], selectedId: string | null): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: saves.map((s) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [s.lng, s.lat] },
      properties: { id: s.id, category: s.category ?? "", selected: s.id === selectedId },
    })),
  };
}

function fit(map: mapboxgl.Map, saves: PoolSave[]) {
  if (saves.length === 0) return;
  const bounds = new mapboxgl.LngLatBounds();
  saves.forEach((s) => bounds.extend([s.lng, s.lat]));
  map.fitBounds(bounds, { padding: 40, maxZoom: 15, duration: 0 });
}

export default function PoolMap({ token, saves, selectedId, moving, onSelect, onMove }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  // The map's event handlers outlive renders; they read current props here.
  const latest = useRef({ saves, selectedId, onSelect, onMove });
  useLayoutEffect(() => {
    latest.current = { saves, selectedId, onSelect, onMove };
  });

  // Create the map once.
  useEffect(() => {
    if (!container.current) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: container.current,
      style: "mapbox://styles/mapbox/light-v11",
      attributionControl: true,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      map.addSource("saves", {
        type: "geojson",
        data: toGeoJSON(latest.current.saves, latest.current.selectedId),
      });
      map.addLayer({
        id: "saves",
        type: "circle",
        source: "saves",
        paint: {
          "circle-color": colorExpression,
          "circle-radius": ["case", ["get", "selected"], 9, 6],
          "circle-stroke-color": ["case", ["get", "selected"], "#111", "#fff"],
          "circle-stroke-width": ["case", ["get", "selected"], 3, 1.5],
        },
      });
      fit(map, latest.current.saves);

      map.on("click", "saves", (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (typeof id === "string") latest.current.onSelect(id);
      });
      map.on("mouseenter", "saves", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "saves", () => (map.getCanvas().style.cursor = ""));
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  // Keep pins in step with the data and the selection.
  useEffect(() => {
    const source = mapRef.current?.getSource("saves") as mapboxgl.GeoJSONSource | undefined;
    source?.setData(toGeoJSON(saves, selectedId));
  }, [saves, selectedId]);

  // Refit when the set of places changes (a city filter), not on every edit.
  const idsKey = saves.map((s) => s.id).join(",");
  useEffect(() => {
    const map = mapRef.current;
    // isStyleLoaded() is briefly false right after setData, so check for the
    // source instead: it exists once the map has loaded.
    if (map?.getSource("saves")) fit(map, latest.current.saves);
  }, [idsKey]);

  // Bring the selected place into view when the selection changes (not when
  // its pin moves, hence reading saves through the ref).
  useEffect(() => {
    const map = mapRef.current;
    const save = latest.current.saves.find((s) => s.id === selectedId);
    if (!map || !save) return;
    if (!map.getBounds()?.contains([save.lng, save.lat])) {
      map.easeTo({ center: [save.lng, save.lat], zoom: Math.max(map.getZoom(), 14) });
    }
  }, [selectedId]);

  // While moving, the selected place gets a draggable marker.
  useEffect(() => {
    markerRef.current?.remove();
    markerRef.current = null;
    const map = mapRef.current;
    const save = latest.current.saves.find((s) => s.id === selectedId);
    if (!map || !moving || !save) return;

    const marker = new mapboxgl.Marker({ draggable: true, color: "#111" })
      .setLngLat([save.lng, save.lat])
      .addTo(map);
    marker.on("dragend", () => {
      const { lat, lng } = marker.getLngLat();
      latest.current.onMove({ lat, lng });
    });
    markerRef.current = marker;
  }, [moving, selectedId]);

  return <div ref={container} className="h-full w-full" aria-label="Map of saved places" />;
}
