"use client";

import { useCallback, useEffect, useState } from "react";
import { CloudOff, Droplets, LocateFixed } from "lucide-react";
import Icon from "@/components/Icon";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { relativeTime } from "@/lib/relative-time";
import { formatTemp, cToF, wmoInfo } from "@/lib/weather-codes";
import type { WeatherResult } from "@/lib/weather";

/**
 * Live weather for the cities this group actually stands in, from our own
 * /api/weather (server-side Open-Meteo, last-good cached in the DB).
 *
 * Offline contract: every successful payload is also kept in localStorage
 * per place, so with no connection the card renders the last-cached
 * forecast labeled with its age ("from 3h ago — offline") — never blank.
 */

type Place = { id: string; label: string; lat: number; lng: number };

const CITIES: Place[] = [
  { id: "rome", label: "Rome", lat: 41.9028, lng: 12.4964 },
  { id: "florence", label: "Florence", lat: 43.7696, lng: 11.2558 },
  { id: "siena", label: "Siena", lat: 43.3188, lng: 11.3308 },
];

const SELECTED_KEY = "sentinella-weather-place";
const CACHE_PREFIX = "sentinella-weather:";

function readLocal(placeId: string): WeatherResult | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + placeId);
    return raw ? (JSON.parse(raw) as WeatherResult) : null;
  } catch {
    return null;
  }
}

function writeLocal(placeId: string, result: WeatherResult) {
  try {
    localStorage.setItem(CACHE_PREFIX + placeId, JSON.stringify(result));
  } catch {
    // Storage full/unavailable: online behavior is unaffected.
  }
}

/** Weekday initial for the 5-day row, in Italy's zone. */
function dayLabel(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" });
}

export default function WeatherCard({
  className = "",
  /** Optional slot rendered above the forecast (Phase-4 warning chip). */
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const [place, setPlace] = useState<Place>(CITIES[0]);
  const [state, setState] = useState<"loading" | "ready" | "offline" | "error">("loading");
  const [data, setData] = useState<WeatherResult | null>(null);
  const [gpsNote, setGpsNote] = useState<string | null>(null);

  // Restore the last-picked city before the first fetch.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SELECTED_KEY);
      const match = CITIES.find((c) => c.id === saved);
      if (match) setPlace(match);
    } catch {
      // Default stands.
    }
  }, []);

  const load = useCallback((p: Place) => {
    setState("loading");
    fetch(`/api/weather?lat=${p.lat}&lng=${p.lng}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((result: WeatherResult) => {
        setData(result);
        setState("ready");
        writeLocal(p.id, result);
      })
      .catch(() => {
        // Server unreachable (likely offline): fall back to the local copy.
        const cached = readLocal(p.id);
        if (cached) {
          setData(cached);
          setState("offline");
        } else {
          setState("error");
        }
      });
  }, []);

  useEffect(() => {
    load(place);
  }, [place, load]);

  function pick(p: Place) {
    setGpsNote(null);
    setPlace(p);
    try {
      localStorage.setItem(SELECTED_KEY, p.id);
    } catch {
      // Best effort.
    }
  }

  function useMyLocation() {
    setGpsNote(null);
    if (!("geolocation" in navigator)) {
      setGpsNote("This device doesn't expose GPS to the browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        pick({
          id: "gps",
          label: "My location",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => setGpsNote("GPS unavailable — pick a city instead."),
      { timeout: 10_000, maximumAge: 5 * 60 * 1000 },
    );
  }

  const chips: Array<{ id: string; label: string; onClick: () => void; icon?: boolean }> = [
    ...CITIES.map((c) => ({ id: c.id, label: c.label, onClick: () => pick(c) })),
    { id: "gps", label: "My location", onClick: useMyLocation, icon: true },
  ];

  return (
    <Card className={className}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-headline">Weather — {place.label}</h2>
      </div>

      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Pick a place">
        {chips.map((chip) => {
          const selected = chip.id === place.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={chip.onClick}
              aria-pressed={selected}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-subhead font-semibold transition-colors duration-150 ${
                selected
                  ? "border-accent bg-accent-subtle text-accent-deep"
                  : "border-default bg-card text-secondary active:bg-sunken"
              }`}
            >
              {chip.icon ? <Icon icon={LocateFixed} size="sm" /> : null}
              {chip.label}
            </button>
          );
        })}
      </div>
      {gpsNote ? <p className="mt-2 text-footnote text-secondary">{gpsNote}</p> : null}

      {children}

      <div className="mt-3">
        {state === "loading" ? (
          <SkeletonCard lines={3} />
        ) : state === "error" || !data ? (
          <EmptyState
            icon={CloudOff}
            title="No forecast available"
            body="Weather needs one connection to cache a forecast for this place. Everything safety-critical on this app still works offline."
            action={
              <Button variant="tinted" size="md" onClick={() => load(place)}>
                Try again
              </Button>
            }
          />
        ) : (
          <Forecast data={data} offline={state === "offline"} />
        )}
      </div>

      {/* Open-Meteo's CC BY attribution requirement. */}
      <p className="mt-3 border-t border-default pt-2 text-footnote text-secondary">
        Weather by{" "}
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="text-link">
          Open-Meteo
        </a>{" "}
        · Seasonal safety advice is in the{" "}
        <a href="/guide#basics" className="text-link">
          field guide
        </a>
        .
      </p>
    </Card>
  );
}

function Forecast({ data, offline }: { data: WeatherResult; offline: boolean }) {
  const { current, daily } = data.forecast;
  const today = daily[0];
  const info = wmoInfo(current.code);
  const age = relativeTime(new Date(data.fetchedAt));

  return (
    <div>
      {offline || data.stale ? (
        <p className="mb-2 rounded-xl bg-sunken px-3 py-2 text-footnote font-semibold text-secondary">
          Forecast from {age}
          {offline ? " — offline" : " — source unreachable"}. Showing the last copy.
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <span className="text-icon-default">
          <Icon icon={info.icon} size="lg" />
        </span>
        <p className="font-mono text-title-large tabular-nums tracking-tight">
          {cToF(current.tempC)}°F
          <span className="ml-2 text-title text-secondary">{Math.round(current.tempC)}°C</span>
        </p>
      </div>
      <p className="mt-1 text-subhead text-secondary">
        {info.label}
        {today ? <> · H {formatTemp(today.maxC)} · L {formatTemp(today.minC)}</> : null}
      </p>
      {today?.precipProb != null ? (
        <p className="mt-1 flex items-center gap-1.5 text-subhead text-secondary">
          <Icon icon={Droplets} size="sm" /> {today.precipProb}% chance of rain today
        </p>
      ) : null}

      {daily.length > 1 ? (
        <ul className="mt-3 grid grid-cols-5 gap-1 border-t border-default pt-3">
          {daily.slice(1, 6).map((day) => {
            const dayInfo = wmoInfo(day.code);
            return (
              <li key={day.date} className="flex flex-col items-center gap-1 text-center">
                <span className="text-caption font-semibold uppercase text-secondary">
                  {dayLabel(day.date)}
                </span>
                <span className="text-icon-default" title={dayInfo.label}>
                  <Icon icon={dayInfo.icon} size="md" />
                </span>
                <span className="text-caption tabular-nums">
                  {cToF(day.maxC)}°
                  <span className="text-tertiary"> {cToF(day.minC)}°</span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}

      <p className="mt-2 text-footnote text-secondary">Checked {age}.</p>
    </div>
  );
}
