import { HEAT_SEASON } from "@/data/weather";

/**
 * Season selection by the calendar in Italy, not the device's home zone —
 * a traveler landing from New York should see what applies in Rome today.
 * Pure and client-safe; the guide stays a static, offline-capable page and
 * the date is evaluated on the device at view time.
 */
export function romeMonthDay(now: Date = new Date()): { month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Rome",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { month: get("month"), day: get("day") };
}

/** True during the Ministry of Health heat-bulletin season (inclusive). */
export function isHeatSeason(now: Date = new Date()): boolean {
  const { month, day } = romeMonthDay(now);
  const value = month * 100 + day;
  const start = HEAT_SEASON.start.month * 100 + HEAT_SEASON.start.day;
  const end = HEAT_SEASON.end.month * 100 + HEAT_SEASON.end.day;
  return value >= start && value <= end;
}
