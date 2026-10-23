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
  // A row the pointer is over in the list; its pin grows to match.
  hoveredId?: string | null;
  // Map height covered by the phone sheet, kept clear when fitting pins.
  bottomInset?: number;
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

// Standard's colour themes: "default" is the fuller palette, "faded" a softer one.
const THEME = "faded";

// Matches --accent in globals.css, light and dark; the map paints outside CSS.
function accent() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "#3b9bff" : "#0062cc";
}

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

// Frame the dense middle of the places, not every outlier: a day trip to
// Tivoli or a hotel by the airport should not zoom Rome out to the province.
function core(saves: MapPin[]) {
  if (saves.length < 8) return saves;
  const mid = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  const lat = mid(saves.map((s) => s.lat));
  const lng = mid(saves.map((s) => s.lng));
  const far = (s: MapPin) => (s.lat - lat) ** 2 + ((s.lng - lng) * Math.cos((lat * Math.PI) / 180)) ** 2;
  return [...saves].sort((a, b) => far(a) - far(b)).slice(0, Math.ceil(saves.length * 0.8));
}

function fit(map: mapboxgl.Map, saves: MapPin[], bottomInset = 0) {
  if (saves.length === 0) return;
  const bounds = new mapboxgl.LngLatBounds();
  core(saves).forEach((s) => bounds.extend([s.lng, s.lat]));
  map.fitBounds(bounds, {
    padding: { top: 40, left: 40, right: 40, bottom: 40 + bottomInset },
    maxZoom: 15,
    duration: 0,
  });
}

export default function PoolMap({
  token,
  saves,
  selectedId,
  hoveredId = null,
  bottomInset = 0,
  moving,
  onSelect,
  onMove,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  // The map's event handlers outlive renders; they read current props here.
  const latest = useRef({ saves, selectedId, bottomInset, onSelect, onMove });
  useLayoutEffect(() => {
    latest.current = { saves, selectedId, bottomInset, onSelect, onMove };
  });

  // Create the map once.
  useEffect(() => {
    if (!container.current) return;
    mapboxgl.accessToken = token;
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    const map = new mapboxgl.Map({
      container: container.current,
      // Mapbox Standard: parks, water and buildings in soft colour, closer to
      // Apple Maps than the grey light style. Its own place icons are off so
      // they never read as our pins; day and night follow the system.
      style: "mapbox://styles/mapbox/standard",
      config: {
        basemap: {
          theme: THEME,
          lightPreset: scheme.matches ? "night" : "day",
          showPointOfInterestLabels: false,
          showTransitLabels: false,
          show3dObjects: false,
        },
      },
      // The phone sheet covers the bottom of the map, so Mapbox's logo and
      // credits sit at the top, where they stay visible.
      attributionControl: false,
      logoPosition: "top-left",
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "top-left");
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      const { rest, selected } = split(latest.current.saves, latest.current.selectedId);
      // Zoomed out, nearby pins merge into a numbered bubble; past
      // neighbourhood level (zoom 14) every pin stands alone.
      map.addSource("saves", {
        type: "geojson",
        data: rest,
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 24,
      });
      map.addSource("selected", { type: "geojson", data: selected });
      // Hovered from the list, drawn on its own like the selection so it
      // shows even when its pin is inside a cluster bubble.
      map.addSource("hovered", { type: "geojson", data: toGeoJSON([]) });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "saves",
        filter: ["has", "point_count"],
        paint: {
          // Lit at full strength, so Standard's night lighting never dims our pins.
          "circle-emissive-strength": 1,
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
        paint: { "text-color": "#fff", "text-emissive-strength": 1 },
      });
      // A soft shadow under each pin, then the pin: big enough to read and
      // tap on a phone in the street.
      map.addLayer({
        id: "saves-shadow",
        type: "circle",
        source: "saves",
        filter: ["!", ["has", "point_count"]],
        paint: {
          // Lit at full strength, so Standard's night lighting never dims our pins.
          "circle-emissive-strength": 1,
          "circle-color": "#000",
          "circle-opacity": 0.22,
          "circle-radius": 10,
          "circle-blur": 0.6,
          "circle-translate": [0, 1.5],
        },
      });
      map.addLayer({
        id: "saves",
        type: "circle",
        source: "saves",
        filter: ["!", ["has", "point_count"]],
        paint: {
          // Lit at full strength, so Standard's night lighting never dims our pins.
          "circle-emissive-strength": 1,
          "circle-color": colorExpression,
          "circle-radius": 8,
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 2.5,
        },
      });
      map.addLayer({
        id: "hovered",
        type: "circle",
        source: "hovered",
        paint: {
          // Lit at full strength, so Standard's night lighting never dims our pins.
          "circle-emissive-strength": 1,
          "circle-color": colorExpression,
          "circle-radius": 11,
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 3,
        },
      });
      map.addLayer({
        id: "selected",
        type: "circle",
        source: "selected",
        paint: {
          // Lit at full strength, so Standard's night lighting never dims our pins.
          "circle-emissive-strength": 1,
          "circle-color": colorExpression,
          "circle-radius": 12,
          "circle-stroke-color": accent(),
          "circle-stroke-width": 4,
        },
      });
      fit(map, latest.current.saves, latest.current.bottomInset);

      // Hit-test a padded box around the tap, so a thumb need not land on
      // the pin itself.
      map.on("click", (e) => {
        const { x, y } = e.point;
        const hit = map.queryRenderedFeatures(
          [
            [x - 12, y - 12],
            [x + 12, y + 12],
          ],
          { layers: ["saves"] },
        );
        const id = hit[0]?.properties?.id;
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

    // Switch day and night in place; Standard keeps our layers when it does.
    const onScheme = () => {
      map.setConfigProperty("basemap", "lightPreset", scheme.matches ? "night" : "day");
      if (map.getLayer("selected")) map.setPaintProperty("selected", "circle-stroke-color", accent());
    };
    scheme.addEventListener("change", onScheme);

    return () => {
      scheme.removeEventListener("change", onScheme);
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
    if (map?.getSource("saves")) fit(map, latest.current.saves, latest.current.bottomInset);
  }, [idsKey]);

  useEffect(() => {
    const map = mapRef.current;
    const hovered = latest.current.saves.filter((s) => s.id === hoveredId && s.id !== selectedId);
    (map?.getSource("hovered") as mapboxgl.GeoJSONSource | undefined)?.setData(toGeoJSON(hovered));
  }, [hoveredId, selectedId]);

  // Bring the selected place into view when the selection changes (not when
  // its pin moves, hence reading saves through the ref).
  useEffect(() => {
    const map = mapRef.current;
    const save = latest.current.saves.find((s) => s.id === selectedId);
    if (!map || !save) return;
    // Zoom in too when it is on screen but hidden inside a cluster bubble.
    if (!map.getBounds()?.contains([save.lng, save.lat]) || map.getZoom() < 14) {
      map.easeTo({
        center: [save.lng, save.lat],
        zoom: Math.max(map.getZoom(), 15),
        padding: { top: 0, left: 0, right: 0, bottom: latest.current.bottomInset },
      });
    }
  }, [selectedId]);

  // While moving, the selected place gets a draggable marker.
  useEffect(() => {
    markerRef.current?.remove();
    markerRef.current = null;
    const map = mapRef.current;
    const save = latest.current.saves.find((s) => s.id === selectedId);
    if (!map || !moving || !save) return;

    const marker = new mapboxgl.Marker({ draggable: true, color: accent() })
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
