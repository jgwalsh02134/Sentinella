/**
 * Server-side Open-Meteo forecasts with last-good caching. Never import
 * from client components — all third-party fetching is server-to-server
 * (no CORS, no keys in the browser; Open-Meteo needs no API key at all).
 *
 * Endpoint verified live 2026-07-24: api.open-meteo.com/v1/forecast with
 * current + daily blocks and timezone=Europe/Rome.
 *
 * Failure contract: a fetch or parse failure never throws past this
 * module — the caller gets the last-good row from weather_cache labeled
 * with its age, or null if this location has never been fetched.
 */
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { weatherCache } from "@/db/schema";

export const WEATHER_REVALIDATE_SECONDS = 30 * 60;

export type DailyForecast = {
  /** ISO date in Europe/Rome, e.g. "2026-07-24". */
  date: string;
  maxC: number;
  minC: number;
  /** Max precipitation probability for the day, 0–100; null if absent. */
  precipProb: number | null;
  /** WMO weather code for the day. */
  code: number;
};

export type Forecast = {
  current: {
    tempC: number;
    apparentC: number;
    code: number;
    windKmh: number;
    /** Local (Europe/Rome) ISO time of the observation. */
    time: string;
  };
  daily: DailyForecast[];
};

export type WeatherResult = {
  forecast: Forecast;
  /** When this payload was fetched from Open-Meteo. */
  fetchedAt: string;
  /** True when the payload is older than 2× the refresh cadence. */
  stale: boolean;
};

/** One cache row per ~1.1 km grid cell; keeps "my location" rows bounded. */
export function locationKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/**
 * Defensive parse of the Open-Meteo response. Returns null on any shape
 * surprise — a format change must degrade to last-good, never crash.
 */
export function parseOpenMeteo(json: unknown): Forecast | null {
  if (typeof json !== "object" || json === null) return null;
  const root = json as Record<string, unknown>;
  const current = root.current as Record<string, unknown> | undefined;
  const daily = root.daily as Record<string, unknown> | undefined;
  if (!current || !daily) return null;

  const tempC = num(current.temperature_2m);
  const apparentC = num(current.apparent_temperature);
  const code = num(current.weather_code);
  const windKmh = num(current.wind_speed_10m);
  if (tempC === null || code === null) return null;

  const dates = Array.isArray(daily.time) ? (daily.time as unknown[]) : [];
  const maxs = Array.isArray(daily.temperature_2m_max) ? (daily.temperature_2m_max as unknown[]) : [];
  const mins = Array.isArray(daily.temperature_2m_min) ? (daily.temperature_2m_min as unknown[]) : [];
  const precs = Array.isArray(daily.precipitation_probability_max)
    ? (daily.precipitation_probability_max as unknown[])
    : [];
  const codes = Array.isArray(daily.weather_code) ? (daily.weather_code as unknown[]) : [];

  const days: DailyForecast[] = [];
  for (let i = 0; i < dates.length; i += 1) {
    const date = typeof dates[i] === "string" ? (dates[i] as string) : null;
    const maxC = num(maxs[i]);
    const minC = num(mins[i]);
    const dayCode = num(codes[i]);
    if (date === null || maxC === null || minC === null || dayCode === null) continue;
    days.push({ date, maxC, minC, precipProb: num(precs[i]), code: dayCode });
  }
  if (days.length === 0) return null;

  return {
    current: {
      tempC,
      apparentC: apparentC ?? tempC,
      code,
      windKmh: windKmh ?? 0,
      time: typeof current.time === "string" ? current.time : "",
    },
    daily: days,
  };
}

function forecastUrl(lat: number, lng: number): string {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code",
    timezone: "Europe/Rome",
    forecast_days: "6",
  });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
}

async function readCache(key: string): Promise<WeatherResult | null> {
  const [row] = await db.select().from(weatherCache).where(eq(weatherCache.locationKey, key));
  if (!row) return null;
  // The cached payload is our own normalized Forecast (written below).
  const cached = row.payload as Forecast | null;
  if (!cached || typeof cached !== "object" || !("current" in cached) || !("daily" in cached)) {
    return null;
  }
  return {
    forecast: cached,
    fetchedAt: row.fetchedAt.toISOString(),
    stale: Date.now() - +row.fetchedAt > 2 * WEATHER_REVALIDATE_SECONDS * 1000,
  };
}

/**
 * Forecast for a location: live (through the Next data cache, 30-min
 * revalidate) with the last-good DB copy as fallback. Returns null only
 * when the source is down AND nothing was ever cached for this key.
 */
export async function getForecast(lat: number, lng: number): Promise<WeatherResult | null> {
  const key = locationKey(lat, lng);
  try {
    const res = await fetch(forecastUrl(lat, lng), {
      next: { revalidate: WEATHER_REVALIDATE_SECONDS },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const forecast = parseOpenMeteo(await res.json());
    if (!forecast) throw new Error("unexpected response shape");

    const fetchedAt = new Date();
    await db
      .insert(weatherCache)
      .values({ locationKey: key, payload: forecast, fetchedAt })
      .onConflictDoUpdate({
        target: weatherCache.locationKey,
        set: { payload: forecast, fetchedAt },
      });
    return { forecast, fetchedAt: fetchedAt.toISOString(), stale: false };
  } catch (err) {
    console.error(`[weather] fetch failed for ${key}:`, err);
    return readCache(key);
  }
}
