"use client";

import dynamic from "next/dynamic";

// maplibre-gl touches window at import time, so the map is client-only.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div
      className="plate mt-5 h-[60dvh] min-h-[20rem] animate-pulse border border-line bg-white motion-reduce:animate-none"
      aria-hidden="true"
    />
  ),
});

export default function MapScreen() {
  return <MapView />;
}
