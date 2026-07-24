import type { Metadata } from "next";
import MapScreen from "./MapScreen";

export const metadata: Metadata = { title: "Map" };

export default function MapPage() {
  return (
    <main>
      <header>
        <p className="eyebrow">Map</p>
        <h1 className="title-page">Know where you are</h1>
        <p className="body-copy mt-1 text-secondary">
          City maps you can download before you travel, with GPS that works even with no signal.
        </p>
      </header>

      <MapScreen />
    </main>
  );
}
