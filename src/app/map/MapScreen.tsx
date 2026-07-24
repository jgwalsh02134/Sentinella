"use client";

import dynamic from "next/dynamic";

// maplibre-gl touches window at import time, so the map is client-only.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="skeleton plate mt-5 h-[60dvh] min-h-80 border border-default" aria-hidden="true" />
  ),
});

export default function MapScreen() {
  return <MapView />;
}
