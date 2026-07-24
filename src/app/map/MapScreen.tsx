"use client";

import dynamic from "next/dynamic";

// maplibre-gl touches window at import time, so the map is client-only.
// The loading fallback mirrors the final full-bleed screen so nothing jumps.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div
      className="skeleton fixed inset-x-0 top-0 z-30 bottom-[4.5rem]"
      role="status"
      aria-label="Loading map"
    />
  ),
});

export default function MapScreen() {
  return <MapView />;
}
