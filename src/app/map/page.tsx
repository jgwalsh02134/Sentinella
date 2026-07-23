import type { Metadata } from "next";
import MapScreen from "./MapScreen";

export const metadata: Metadata = { title: "Map" };

export default function MapPage() {
  return (
    <main>
      <header>
        <p className="eyebrow">Map</p>
        <h1 className="text-2xl font-extrabold tracking-tight">Know where you are</h1>
        <p className="mt-1 text-sm leading-relaxed text-mist">
          City maps you can download before you travel, with GPS that works even with no signal.
        </p>
      </header>

      <MapScreen />
    </main>
  );
}
