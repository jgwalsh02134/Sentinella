import type { Metadata } from "next";
import { MAP_PACKS } from "@/data/mapPacks";
import MapScreen from "./MapScreen";

export const metadata: Metadata = { title: "Map" };

function mb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * /map is a full-bleed map screen, not a page with a map in it: MapScreen
 * renders fixed between the header strip and the bottom nav, and the page
 * never scrolls. The <noscript> block below is the only server-rendered
 * content — with JavaScript off, it still says what the map is and which
 * packs exist.
 */
export default function MapPage() {
  return (
    <main>
      <noscript>
        <h1 className="text-title-large">Map</h1>
        <p className="mt-2 text-body text-secondary">
          A safety map that works with zero signal: your GPS position, 24h emergency rooms,
          embassies, and the way back to your hotel. The interactive map needs JavaScript.
        </p>
        <ul className="mt-3 space-y-1">
          {MAP_PACKS.map((pack) => (
            <li key={pack.id} className="text-callout">
              <strong className="font-bold">{pack.name}</strong>{" "}
              <span className="text-secondary">
                · {mb(pack.sizeBytes)} — downloadable for offline use
              </span>
            </li>
          ))}
        </ul>
      </noscript>
      <MapScreen />
    </main>
  );
}
