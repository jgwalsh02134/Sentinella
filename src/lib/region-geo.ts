/**
 * Coordinates for the regions in src/data/regions.ts, for matching a GPS
 * fix to the advisory region it falls in. Client- and server-safe.
 */

type Point = { lat: number; lng: number };

const REGION_POINTS: Record<string, Point[]> = {
  Rome: [{ lat: 41.9028, lng: 12.4964 }],
  Milan: [{ lat: 45.4642, lng: 9.19 }],
  Naples: [{ lat: 40.8518, lng: 14.2681 }],
  Florence: [{ lat: 43.7696, lng: 11.2558 }],
  Venice: [{ lat: 45.4408, lng: 12.3155 }],
  "South & islands (driving)": [
    { lat: 38.1157, lng: 13.3615 }, // Palermo
    { lat: 37.5079, lng: 15.083 }, // Catania
    { lat: 39.2238, lng: 9.1217 }, // Cagliari
    { lat: 40.634, lng: 14.6027 }, // Amalfi
    { lat: 41.1171, lng: 16.8719 }, // Bari
  ],
};

export function distanceKm(a: Point, b: Point): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** The closest known region within maxKm of the fix, or null. */
export function nearestRegion(lat: number, lng: number, maxKm = 120): string | null {
  let best: { name: string; km: number } | null = null;
  for (const [name, points] of Object.entries(REGION_POINTS)) {
    for (const p of points) {
      const km = distanceKm({ lat, lng }, p);
      if (km <= maxKm && (best === null || km < best.km)) best = { name, km };
    }
  }
  return best?.name ?? null;
}
