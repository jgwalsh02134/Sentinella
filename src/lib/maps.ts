/**
 * Directions FOR THE USER open Apple Maps: on iOS the maps.apple.com URL
 * hands off to the native app; in any other browser it works as a web page.
 *
 * OUTBOUND sharing (ShareLocation, check-in history) stays on Google Maps
 * URLs on purpose — the recipient may be on Android.
 */
export function appleMapsDirectionsUrl(destination: string): string {
  return `https://maps.apple.com/?daddr=${encodeURIComponent(destination)}`;
}
