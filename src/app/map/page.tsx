import type { Metadata } from "next";
import { MAP_PACKS } from "@/data/mapPacks";
import MapScreen from "./MapScreen";

export const metadata: Metadata = { title: "Map" };

function mb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * The structure below server-renders on purpose (progressive enhancement):
 * if JavaScript fails entirely, the page still says what the map is, which
 * packs exist and their sizes, and that it works offline after download.
 */
export default function MapPage() {
  return (
    <main>
      <header>
        <p className="eyebrow">Map</p>
        <h1 className="title-page">Know where you are</h1>
        <p className="body-copy mt-1 text-secondary">
          A safety map that works with zero signal: your GPS position, 24h emergency rooms,
          embassies, and the way back to your hotel.
        </p>
      </header>

      <ul className="mt-3 space-y-1">
        {MAP_PACKS.map((pack) => (
          <li key={pack.id} className="text-callout">
            <strong className="font-bold">{pack.name}</strong>{" "}
            <span className="text-secondary">
              · {mb(pack.sizeBytes)} — download below, then it works offline
            </span>
          </li>
        ))}
      </ul>

      <MapScreen />
    </main>
  );
}
