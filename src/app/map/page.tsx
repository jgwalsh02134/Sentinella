import type { Metadata } from "next";
import SectionHeader from "@/components/ui/SectionHeader";
import { MAP_PACKS } from "@/data/mapPacks";
import MapScreen from "./MapScreen";

export const metadata: Metadata = { title: "Map" };

function mb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * The header server-renders on purpose (progressive enhancement): if
 * JavaScript is unavailable, the page still says what the map is and which
 * packs exist — the <noscript> list below carries the pack names and sizes
 * without duplicating the interactive list when JS works.
 */
export default function MapPage() {
  return (
    <main>
      <SectionHeader
        level={1}
        eyebrow="Map"
        title="Know where you are"
        intro="A safety map that works with zero signal: your GPS position, 24h emergency rooms, embassies, and the way back to your hotel."
      />

      <noscript>
        <ul className="mt-3 space-y-1">
          {MAP_PACKS.map((pack) => (
            <li key={pack.id} className="text-callout">
              <strong className="font-bold">{pack.name}</strong>{" "}
              <span className="text-secondary">
                · {mb(pack.sizeBytes)} — downloadable for offline use (needs JavaScript)
              </span>
            </li>
          ))}
        </ul>
      </noscript>

      <MapScreen />
    </main>
  );
}
