/**
 * The most recent GPS fix the user has taken this session (Share my
 * position, the map's locate button, or trip tracking). Session-scoped on
 * purpose: it powers "Near you" sorting, and stale location is worse than
 * none. Client-only.
 */

const KEY = "sentinella-last-fix";

export type LastFix = { lat: number; lng: number; at: number };

export function saveLastFix(lat: number, lng: number): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ lat, lng, at: Date.now() } satisfies LastFix));
  } catch {
    // Private browsing can deny storage; "Near you" just won't appear.
  }
}

export function readLastFix(): LastFix | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const fix = JSON.parse(raw) as LastFix;
    return typeof fix.lat === "number" && typeof fix.lng === "number" ? fix : null;
  } catch {
    return null;
  }
}
