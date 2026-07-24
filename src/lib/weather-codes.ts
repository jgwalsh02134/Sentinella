/**
 * WMO weather-code → label + app icon (Lucide, the app's one icon set —
 * never emoji). Codes per the WMO 4677 table Open-Meteo documents.
 * Unknown codes fall back to a plain cloud with a generic label rather
 * than crashing or inventing conditions.
 */
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Snowflake,
  Sun,
  type LucideIcon,
} from "lucide-react";

export type WmoInfo = { label: string; icon: LucideIcon };

const TABLE: Array<{ codes: number[]; info: WmoInfo }> = [
  { codes: [0], info: { label: "Clear", icon: Sun } },
  { codes: [1], info: { label: "Mostly clear", icon: Sun } },
  { codes: [2], info: { label: "Partly cloudy", icon: CloudSun } },
  { codes: [3], info: { label: "Overcast", icon: Cloud } },
  { codes: [45, 48], info: { label: "Fog", icon: CloudFog } },
  { codes: [51, 53, 55, 56, 57], info: { label: "Drizzle", icon: CloudDrizzle } },
  { codes: [61, 63], info: { label: "Rain", icon: CloudRain } },
  { codes: [65], info: { label: "Heavy rain", icon: CloudRain } },
  { codes: [66, 67], info: { label: "Freezing rain", icon: CloudRain } },
  { codes: [71, 73, 75], info: { label: "Snow", icon: CloudSnow } },
  { codes: [77], info: { label: "Snow grains", icon: Snowflake } },
  { codes: [80, 81], info: { label: "Rain showers", icon: CloudRain } },
  { codes: [82], info: { label: "Heavy showers", icon: CloudRain } },
  { codes: [85, 86], info: { label: "Snow showers", icon: CloudSnow } },
  { codes: [95], info: { label: "Thunderstorm", icon: CloudLightning } },
  { codes: [96, 99], info: { label: "Thunderstorm, hail", icon: CloudLightning } },
];

const BY_CODE = new Map<number, WmoInfo>();
for (const row of TABLE) for (const c of row.codes) BY_CODE.set(c, row.info);

export function wmoInfo(code: number): WmoInfo {
  return BY_CODE.get(code) ?? { label: "Changeable", icon: Cloud };
}

/** "64°F / 18°C" — °F primary for US travelers, °C for local signage. */
export function formatTemp(tempC: number): string {
  return `${Math.round(tempC * 1.8 + 32)}°F / ${Math.round(tempC)}°C`;
}

export function cToF(tempC: number): number {
  return Math.round(tempC * 1.8 + 32);
}
