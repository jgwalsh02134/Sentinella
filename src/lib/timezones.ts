/**
 * Dual-timezone helpers for Europe/Rome and America/New_York.
 *
 * Everything derives from Intl with explicit IANA zones — never a fixed
 * offset — because the zones disagree for one week a year: Europe falls
 * back on the last Sunday of October, the US on the first Sunday of
 * November, so Italy is briefly 5 hours ahead instead of 6. The mismatch
 * detection reads the actual computed offsets, so it self-activates every
 * year without a date table.
 */

export const ITALY_TZ = "Europe/Rome";
export const NEW_YORK_TZ = "America/New_York";

/** UTC offset in minutes of an IANA zone at a given moment. */
export function tzOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  // Some engines report midnight as "24".
  const wallAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );
  return Math.round((wallAsUtc - +date) / 60_000);
}

/** How many hours Italy is ahead of New York at this moment (usually 6). */
export function italyAheadHours(date: Date = new Date()): number {
  return (tzOffsetMinutes(date, ITALY_TZ) - tzOffsetMinutes(date, NEW_YORK_TZ)) / 60;
}

/**
 * True during the autumn week when Italy has already fallen back but the
 * US hasn't — 5 hours apart instead of 6.
 */
export function isDstMismatch(date: Date = new Date()): boolean {
  return italyAheadHours(date) === 5;
}

/** "14:05 in Italy · 8:05 AM in New York" */
export function formatDualTime(date: Date): string {
  const italy = date.toLocaleTimeString("en-GB", {
    timeZone: ITALY_TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
  const newYork = date.toLocaleTimeString("en-US", {
    timeZone: NEW_YORK_TZ,
    hour: "numeric",
    minute: "2-digit",
  });
  return `${italy} in Italy · ${newYork} in New York`;
}

/** "Thu 23 Jul · 14:05 in Italy · 8:05 AM in New York" (date in Italy's zone). */
export function formatDualDateTime(date: Date): string {
  const day = date.toLocaleDateString("en-GB", {
    timeZone: ITALY_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return `${day} · ${formatDualTime(date)}`;
}
