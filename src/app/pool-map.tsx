"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import type { FeatureCollection } from "geojson";
import mapboxgl from "mapbox-gl";
import { useEffect, useLayoutEffect, useRef } from "react";

import { CATEGORY_COLOR, UNSORTED_COLOR, type MapPin } from "./pool-types";

type Props = {
  token: string;
  saves: MapPin[];
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

function toGeoJSON(saves: MapPin[]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: saves.map((s) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [s.lng, s.lat] },
      properties: { id: s.id, category: s.category ?? "" },
    })),
  };
}

// The selected place is drawn from its own source, never clustered, so it
// stays visible however far out the map is zoomed.
function split(saves: MapPin[], selectedId: string | null) {
  return {
    rest: toGeoJSON(saves.filter((s) => s.id !== selectedId)),
    selected: toGeoJSON(saves.filter((s) => s.id === selectedId)),
  };
}

function fit(map: mapboxgl.Map, saves: MapPin[]) {
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
      const { rest, selected } = split(latest.current.saves, latest.current.selectedId);
      // Zoomed out, nearby pins merge into a numbered bubble; past street
      // level (zoom 14) every pin stands alone.
      map.addSource("saves", {
        type: "geojson",
        data: rest,
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 36,
      });
      map.addSource("selected", { type: "geojson", data: selected });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "saves",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#262626",
          "circle-opacity": 0.85,
          "circle-radius": ["step", ["get", "point_count"], 13, 10, 16, 50, 20],
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1.5,
        },
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "saves",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 12,
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
        },
        paint: { "text-color": "#fff" },
      });
      map.addLayer({
        id: "saves",
        type: "circle",
        source: "saves",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": colorExpression,
          "circle-radius": 6,
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1.5,
        },
      });
      map.addLayer({
        id: "selected",
        type: "circle",
        source: "selected",
        paint: {
          "circle-color": colorExpression,
          "circle-radius": 9,
          "circle-stroke-color": "#111",
          "circle-stroke-width": 3,
        },
      });
      fit(map, latest.current.saves);

      map.on("click", "saves", (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (typeof id === "string") latest.current.onSelect(id);
      });
      // Tapping a bubble zooms in until it breaks apart.
      map.on("click", "clusters", (e) => {
        const feature = e.features?.[0];
        const clusterId = feature?.properties?.cluster_id;
        const source = map.getSource("saves") as mapboxgl.GeoJSONSource | undefined;
        if (typeof clusterId !== "number" || !source || feature?.geometry.type !== "Point") return;
        const [lng, lat] = feature.geometry.coordinates;
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || zoom == null) return;
          map.easeTo({ center: [lng, lat], zoom });
        });
      });
      for (const layer of ["saves", "clusters"]) {
        map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""));
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  // Keep pins in step with the data and the selection.
  useEffect(() => {
    const map = mapRef.current;
    const { rest, selected } = split(saves, selectedId);
    (map?.getSource("saves") as mapboxgl.GeoJSONSource | undefined)?.setData(rest);
    (map?.getSource("selected") as mapboxgl.GeoJSONSource | undefined)?.setData(selected);
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
