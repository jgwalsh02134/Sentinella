"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { FetchSource, PMTiles, Protocol } from "pmtiles";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_PACKS, type MapPack } from "@/data/mapPacks";
import { safetyPois, type SafetyPoi } from "@/data/safetyPois";
import { buildMapStyle } from "@/lib/mapStyle";
import { appleMapsDirectionsUrl } from "@/lib/maps";
import ActionRow, { type Action } from "@/components/ui/ActionRow";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Callout from "@/components/ui/Callout";
import Card from "@/components/ui/Card";
import { Field, FieldError, Input } from "@/components/ui/Field";
import SectionHeader from "@/components/ui/SectionHeader";
import Switch from "@/components/ui/Switch";
import { bearingDeg, cardinal, formatKm, haversineKm } from "@/lib/geo";
import { saveLastFix } from "@/lib/lastFix";

function cityStyle(city: MapPack) {
  return buildMapStyle({ key: city.id, bounds: city.bbox, maxzoom: city.maxzoom });
}
import {
  BlobSource,
  KeyedSource,
  downloadPack,
  getStoredPack,
  isValidPack,
  listStoredPackIds,
  removePack,
  requestPersistentStorage,
  storePack,
} from "@/lib/mapPacks";

/** maplibre-gl v5 renders with WebGL2; without it we show a notice, not a blank box. */
function webgl2Available(): boolean {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

/**
 * One protocol instance for the lifetime of the tab. Each city keeps a
 * stable `pmtiles://<id>` key; protocol.add() swaps what backs it (IndexedDB
 * Blob when downloaded, HTTP range requests against /map-packs/ otherwise).
 */
const protocol = new Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

const ACTIVE_CITY_KEY = "sentinella-active-city";
const HOME_BASE_KEY = "sentinella-home-base";

type Fix = { lat: number; lng: number; accuracyM: number };
type HomeBase = { name: string; lat: number; lng: number };

function loadHomeBase(): HomeBase | null {
  try {
    const raw = window.localStorage.getItem(HOME_BASE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HomeBase;
    return typeof parsed?.lat === "number" && typeof parsed?.lng === "number" ? parsed : null;
  } catch {
    return null;
  }
}

/** Marker glyphs: color is never the only signal — each kind has its own
 *  shape, and the bottom sheet names the place. */
const POI_GLYPHS: Record<SafetyPoi["kind"], string> = {
  er: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z"/></svg>',
  embassy:
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 21V4"/><path d="M6 4h11l-2.5 4L17 12H6"/></svg>',
};

const BASE_GLYPH =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>';

/** 44px tap target around a 30px visual pin. */
function markerElement(kind: SafetyPoi["kind"] | "base", label: string): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute("aria-label", label);
  el.className = "flex h-11 w-11 items-center justify-center";
  const color =
    kind === "er" ? "bg-verde" : kind === "embassy" ? "bg-azzurro" : "bg-terracotta";
  el.innerHTML = `<span class="pointer-events-none flex h-[1.875rem] w-[1.875rem] items-center justify-center rounded-full ${color} text-white ring-2 ring-white">${
    kind === "base" ? BASE_GLYPH : POI_GLYPHS[kind]
  }</span>`;
  return el;
}

function formatSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Points the city's pmtiles:// key at its data. Downloaded-first: a stored
 * Blob (validated) always wins; HTTP range streaming is only the online
 * preview for packs not yet downloaded. Returns "corrupt" when a stored
 * pack fails validation (evicted mid-write, truncated) so the UI can say so.
 */
async function registerCitySource(
  city: MapPack,
  useStoredBlob: boolean,
): Promise<"blob" | "stream" | "corrupt"> {
  if (useStoredBlob) {
    const stored = await getStoredPack(city.id);
    if (stored && (await isValidPack(stored.blob))) {
      protocol.add(new PMTiles(new BlobSource(stored.blob, city.id)));
      return "blob";
    }
    if (stored) {
      await removePack(city.id);
      const url = new URL(`/map-packs/${city.id}.pmtiles`, window.location.href).href;
      protocol.add(new PMTiles(new KeyedSource(new FetchSource(url), city.id)));
      return "corrupt";
    }
  }
  const url = new URL(`/map-packs/${city.id}.pmtiles`, window.location.href).href;
  protocol.add(new PMTiles(new KeyedSource(new FetchSource(url), city.id)));
  return "stream";
}

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const abortersRef = useRef(new Map<string, AbortController>());
  const persistRequestedRef = useRef(false);

  const [downloaded, setDownloaded] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeCityId, setActiveCityId] = useState<string>(MAP_PACKS[0].id);
  const [fix, setFix] = useState<Fix | null>(null);
  const [locating, setLocating] = useState(false);
  /** One quiet in-UI notice for map-level failures (WebGL, tile errors). */
  const [mapNotice, setMapNotice] = useState<string | null>(null);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<SafetyPoi | null>(null);
  const [base, setBase] = useState<HomeBase | null>(null);
  const [baseName, setBaseName] = useState("Hotel");
  const baseMarkerRef = useRef<maplibregl.Marker | null>(null);

  /** Nearest 24h ER by straight-line distance — recomputed per GPS fix. */
  const nearestEr = useMemo(() => {
    if (!fix) return null;
    let best: { poi: SafetyPoi; km: number; bearing: number } | null = null;
    for (const poi of safetyPois) {
      if (poi.kind !== "er") continue;
      const km = haversineKm(fix.lat, fix.lng, poi.lngLat[1], poi.lngLat[0]);
      if (!best || km < best.km) {
        best = { poi, km, bearing: bearingDeg(fix.lat, fix.lng, poi.lngLat[1], poi.lngLat[0]) };
      }
    }
    return best;
  }, [fix]);

  const baseReadout = useMemo(() => {
    if (!fix || !base) return null;
    return {
      km: haversineKm(fix.lat, fix.lng, base.lat, base.lng),
      bearing: bearingDeg(fix.lat, fix.lng, base.lat, base.lng),
    };
  }, [fix, base]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!webgl2Available()) {
        setMapNotice(
          "This browser can't draw the map (WebGL unavailable). Emergency numbers and the guide still work — and your GPS coordinates show on the check-in screen.",
        );
        return;
      }

      const storedIds = await listStoredPackIds();
      const saved = window.localStorage.getItem(ACTIVE_CITY_KEY);
      let city = MAP_PACKS.find((c) => c.id === saved) ?? MAP_PACKS[0];

      // Deterministic offline: never stream with no connection. Fall back
      // to a downloaded pack, or say plainly that one is required.
      if (!navigator.onLine && !storedIds.includes(city.id)) {
        const fallback = MAP_PACKS.find((c) => storedIds.includes(c.id));
        if (fallback) {
          city = fallback;
        } else {
          setDownloaded(new Set(storedIds));
          setMapNotice(
            "No connection and no downloaded map. Download Rome or Tuscany below when you're back online — after that the map works offline.",
          );
          return;
        }
      }

      const sourceState = await registerCitySource(city, storedIds.includes(city.id));
      if (cancelled || !containerRef.current) return;

      if (sourceState === "corrupt") {
        storedIds.splice(storedIds.indexOf(city.id), 1);
        setErrors((e) => ({
          ...e,
          [city.id]: "The downloaded pack was corrupt and has been removed. Download it again.",
        }));
      }
      setDownloaded(new Set(storedIds));
      setActiveCityId(city.id);

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: cityStyle(city),
        center: city.center,
        zoom: 12.5,
        minZoom: 4,
        maxZoom: 17.5,
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

      // Tile/glyph failures become one quiet notice, not devtools spam.
      let noticed = false;
      map.on("error", () => {
        if (noticed) return;
        noticed = true;
        setMapNotice(
          "Some map data couldn't load. Downloaded areas keep working offline; outside them the map needs a connection.",
        );
      });

      const geolocate = new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true, timeout: 30000 },
        trackUserLocation: true,
        showUserLocation: true,
      });
      map.addControl(geolocate, "top-right");
      geolocate.on("trackuserlocationstart", () => {
        setLocating(true);
        setGpsNotice(null);
      });
      geolocate.on("geolocate", (e: GeolocationPosition) => {
        setLocating(false);
        setFix({ lat: e.coords.latitude, lng: e.coords.longitude, accuracyM: e.coords.accuracy });
        saveLastFix(e.coords.latitude, e.coords.longitude);
      });
      geolocate.on("error", (e: GeolocationPositionError) => {
        setLocating(false);
        setGpsNotice(
          e?.code === 1
            ? "Location permission is off for this site. Allow it in your browser settings, then tap the location button again."
            : "Couldn't get a GPS fix. Stand outdoors with a clear view of the sky and try again.",
        );
      });

      // Safety POI overlay: DOM markers survive style swaps between packs,
      // and the data is bundled — they work fully offline.
      for (const poi of safetyPois) {
        const el = markerElement(poi.kind, poi.name);
        el.addEventListener("click", (ev) => {
          ev.stopPropagation();
          setSelectedPoi(poi);
          mapRef.current?.easeTo({ center: poi.lngLat });
        });
        new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat(poi.lngLat).addTo(map);
      }

      mapRef.current = map;
      setBase(loadHomeBase());
      // Debug/verification handle (safe: client-only, no auth surface).
      (window as unknown as { __sentinellaMap?: maplibregl.Map }).__sentinellaMap = map;
    })();

    const aborters = abortersRef.current;
    return () => {
      cancelled = true;
      aborters.forEach((a) => a.abort());
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Keep the home-base marker in sync with the saved base.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    baseMarkerRef.current?.remove();
    baseMarkerRef.current = null;
    if (base) {
      const el = markerElement("base", `Home base: ${base.name}`);
      baseMarkerRef.current = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([base.lng, base.lat])
        .addTo(map);
    }
  }, [base]);

  function saveBase() {
    if (!fix) return;
    const next: HomeBase = { name: baseName.trim() || "Hotel", lat: fix.lat, lng: fix.lng };
    window.localStorage.setItem(HOME_BASE_KEY, JSON.stringify(next));
    setBase(next);
  }

  function removeBase() {
    window.localStorage.removeItem(HOME_BASE_KEY);
    setBase(null);
  }

  /** Re-point the active city's source and force the style to re-read it. */
  async function refreshActiveSource(city: MapPack, useStoredBlob: boolean) {
    await registerCitySource(city, useStoredBlob);
    mapRef.current?.setStyle(cityStyle(city), { diff: false });
  }

  async function selectCity(city: MapPack) {
    if (!navigator.onLine && !downloaded.has(city.id)) {
      setErrors((e) => ({
        ...e,
        [city.id]: `${city.name} isn't downloaded, and there's no connection to stream it. Download it when you're back online.`,
      }));
      return;
    }
    setActiveCityId(city.id);
    window.localStorage.setItem(ACTIVE_CITY_KEY, city.id);
    await registerCitySource(city, downloaded.has(city.id));
    const map = mapRef.current;
    if (map) {
      map.setStyle(cityStyle(city), { diff: false });
      map.jumpTo({ center: city.center, zoom: 12.5 });
    }
  }

  async function togglePack(city: MapPack) {
    setErrors((e) => ({ ...e, [city.id]: "" }));

    const inFlight = abortersRef.current.get(city.id);
    if (inFlight) {
      inFlight.abort();
      abortersRef.current.delete(city.id);
      setProgress((p) => {
        const { [city.id]: _dropped, ...rest } = p;
        return rest;
      });
      return;
    }

    if (downloaded.has(city.id)) {
      await removePack(city.id);
      setDownloaded((d) => {
        const next = new Set(d);
        next.delete(city.id);
        return next;
      });
      if (city.id === activeCityId) await refreshActiveSource(city, false);
      return;
    }

    if (!persistRequestedRef.current) {
      persistRequestedRef.current = true;
      void requestPersistentStorage();
    }

    const aborter = new AbortController();
    abortersRef.current.set(city.id, aborter);
    setProgress((p) => ({ ...p, [city.id]: 0 }));
    try {
      const blob = await downloadPack(
        `/map-packs/${city.id}.pmtiles`,
        (received, total) => {
          const share = total > 0 ? received / total : received / city.sizeBytes;
          setProgress((p) => ({ ...p, [city.id]: Math.min(share, 1) }));
        },
        aborter.signal,
      );
      await storePack(city.id, blob);
      setDownloaded((d) => new Set(d).add(city.id));
      if (city.id === activeCityId) await refreshActiveSource(city, true);
    } catch (err) {
      if (!aborter.signal.aborted) {
        const quotaHit = err instanceof DOMException && err.name === "QuotaExceededError";
        setErrors((e) => ({
          ...e,
          [city.id]: quotaHit
            ? "Not enough storage on this device. Free up space, then download again."
            : err instanceof Error
              ? err.message
              : "Download failed. Check your connection and try again.",
        }));
      }
    } finally {
      abortersRef.current.delete(city.id);
      setProgress((p) => {
        const { [city.id]: _dropped, ...rest } = p;
        return rest;
      });
    }
  }

  return (
    <div>
      <div className="relative mt-5">
        <div
          ref={containerRef}
          className="plate h-[60dvh] min-h-80 overflow-hidden border border-default bg-card"
          role="application"
          aria-label="City map with safety locations"
        />
        {base && baseReadout ? (
          <p
            className="pointer-events-none absolute left-2 top-2 flex items-center gap-2 rounded-full border border-default bg-card/95 px-3 py-2 text-footnote font-bold"
            role="status"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0 text-terracotta"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ transform: `rotate(${Math.round(baseReadout.bearing)}deg)` }}
            >
              <path d="M12 19V5" />
              <path d="M5 12l7-7 7 7" />
            </svg>
            {base.name} — {formatKm(baseReadout.km)} {cardinal(baseReadout.bearing)}
          </p>
        ) : null}
      </div>
      {mapNotice ? (
        <Callout className="mt-2">{mapNotice}</Callout>
      ) : null}
      {nearestEr ? (
        <p className="mt-2 rounded-xl bg-verde-tint px-3 py-2 text-callout font-semibold text-verde-deep" role="status">
          Nearest ER: {nearestEr.poi.shortName} — {formatKm(nearestEr.km)}{" "}
          {cardinal(nearestEr.bearing)} of you{" "}
          <span className="font-normal">(straight line, not a route)</span>
        </p>
      ) : null}
      <p className="mt-2 text-footnote text-secondary">
        Markers: <span className="font-semibold text-verde-deep">+</span> 24h emergency rooms ·{" "}
        <span className="font-semibold text-azzurro-900">⚑</span> embassies & consulates. All work
        offline; tap one for call and directions.
      </p>

      <Card className="mt-3">
        <h2 className="text-headline">Your position</h2>
        {fix ? (
          <>
            <p className="mt-1 font-mono text-title font-bold tabular-nums text-verde-deep">
              {fix.lat.toFixed(5)}, {fix.lng.toFixed(5)}
            </p>
            <p className="mt-1 text-footnote text-secondary">Accurate to ~{Math.round(fix.accuracyM)} m.</p>
          </>
        ) : (
          <p className="mt-1 text-body text-secondary">
            {locating
              ? "Getting a fix… without cell service the first one can take a minute — stand outdoors with a clear view of the sky."
              : "Tap the location button on the map for the blue dot and your coordinates. GPS works with no signal; the first fix without cell service can take a minute outdoors."}
          </p>
        )}
        {gpsNotice ? (
          <p className="mt-2 text-callout font-medium text-warning" role="status">
            {gpsNotice}
          </p>
        ) : null}

        {base ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-default pt-3">
            <p className="min-w-0 flex-1 text-callout">
              <strong className="font-bold">{base.name}</strong> saved as home base
              {baseReadout ? (
                <span className="text-secondary">
                  {" "}
                  — {formatKm(baseReadout.km)} {cardinal(baseReadout.bearing)} of you
                </span>
              ) : null}
            </p>
            <Button variant="destructive" size="md" onClick={removeBase}>
              Remove
            </Button>
          </div>
        ) : fix ? (
          <div className="mt-3 border-t border-default pt-3">
            <Field label="Save this spot">
              <span className="flex gap-2">
                <Input
                  type="text"
                  value={baseName}
                  onChange={(e) => setBaseName(e.target.value)}
                  maxLength={24}
                  className="w-0 min-w-0 flex-1"
                  aria-label="Name for this spot"
                />
                <Button variant="primary" size="md" onClick={saveBase} className="shrink-0">
                  Save spot
                </Button>
              </span>
            </Field>
            <p className="mt-2 text-footnote text-secondary">
              Saves on this device only. A chip on the map then points back here — which way is
              the hotel, at a glance.
            </p>
          </div>
        ) : null}
      </Card>

      <section className="mt-8" aria-label="Offline maps">
        <SectionHeader
          title="Offline maps"
          intro="Download before you travel and the map works with no connection. Rome covers the metro area to building level; Tuscany covers the hill towns and the roads between them."
        />
        <Card padded={false} className="mt-3">
          {MAP_PACKS.map((city, i) => {
            const isDownloaded = downloaded.has(city.id);
            const pct = progress[city.id];
            const isDownloading = pct !== undefined;
            const isActive = city.id === activeCityId;
            return (
              <div key={city.id} className={i > 0 ? "border-t border-default" : ""}>
                <div className="flex min-h-14 items-center gap-3 p-3">
                  <button
                    type="button"
                    onClick={() => void selectCity(city)}
                    className="min-h-control min-w-0 flex-1 rounded-xl text-left"
                    aria-label={`Show ${city.name} on the map`}
                  >
                    <span className="block text-callout font-bold">
                      {city.name} <span className="font-normal text-secondary">· {city.nameIt}</span>
                      {isActive ? (
                        <Badge tone="success" className="ml-2">
                          Viewing
                        </Badge>
                      ) : null}
                    </span>
                    <span className="block text-footnote text-secondary">
                      {isDownloading
                        ? `Downloading… ${Math.round((pct ?? 0) * 100)}%`
                        : isDownloaded
                          ? `Downloaded · ${formatSize(city.sizeBytes)} on this device`
                          : `${formatSize(city.sizeBytes)} download`}
                    </span>
                  </button>
                  <Switch
                    checked={isDownloaded || isDownloading}
                    onChange={() => void togglePack(city)}
                    label={`Offline map for ${city.name}`}
                  />
                </div>
                {isDownloading ? (
                  <div className="px-3 pb-3" aria-hidden="true">
                    <div className="h-1 overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full bg-verde transition-[width] motion-reduce:transition-none"
                        style={{ width: `${Math.round((pct ?? 0) * 100)}%` }}
                      />
                    </div>
                  </div>
                ) : null}
                {errors[city.id] ? (
                  <div className="px-3 pb-3">
                    <FieldError>{errors[city.id]}</FieldError>
                    {!isDownloaded && !isDownloading ? (
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => void togglePack(city)}
                        className="mt-2"
                      >
                        Download again
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </Card>
        <p className="mt-2 text-footnote text-secondary">
          Downloads live in this browser's storage. iOS may evict them if the device runs low on
          space — re-download before you travel. Outside a downloaded area the map needs a
          connection. Map data © OpenStreetMap contributors.
        </p>
      </section>

      {selectedPoi ? (
        <div
          role="dialog"
          aria-label={selectedPoi.name}
          className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-md px-4 pb-2"
        >
          <div className="plate border border-strong bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="eyebrow">
                  {selectedPoi.kind === "er" ? "24h emergency room" : "Embassy / consulate"}
                </p>
                <h3 className="text-headline">{selectedPoi.name}</h3>
                <p className="mt-1 text-footnote text-secondary">{selectedPoi.address}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPoi(null)}
                aria-label="Close"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-secondary active:bg-sunken"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <ActionRow
              className="mt-3"
              actions={
                [
                  selectedPoi.dial ? { label: "Call", href: `tel:${selectedPoi.dial}` } : null,
                  {
                    label: "Get directions",
                    href: appleMapsDirectionsUrl(`${selectedPoi.address}, Italy`),
                  },
                  selectedPoi.poisonDial && selectedPoi.poisonDial !== selectedPoi.dial
                    ? {
                        label: `Poison control — ${selectedPoi.poisonPhone}`,
                        href: `tel:${selectedPoi.poisonDial}`,
                      }
                    : null,
                ].filter(Boolean) as Action[]
              }
            />
            <p className="mt-2 text-footnote text-secondary">
              Calls work offline via the phone network. Directions need a connection.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
