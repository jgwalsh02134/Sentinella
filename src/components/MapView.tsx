"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { FetchSource, PMTiles, Protocol } from "pmtiles";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_PACKS, type MapPack } from "@/data/mapPacks";
import { buildMapStyle } from "@/lib/mapStyle";
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

type Fix = { lat: number; lng: number; accuracyM: number };

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

      mapRef.current = map;
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
      <div
        ref={containerRef}
        className="plate mt-5 h-[60dvh] min-h-[20rem] overflow-hidden border border-default bg-card"
        role="application"
        aria-label="City map"
      />
      {mapNotice ? (
        <p className="callout mt-2" role="status">
          {mapNotice}
        </p>
      ) : null}

      <div className="plate mt-3 border border-default bg-card p-4">
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
          <p className="mt-2 text-callout font-medium text-ambra" role="status">
            {gpsNotice}
          </p>
        ) : null}
      </div>

      <section className="mt-8" aria-label="Offline maps">
        <h2 className="title-section">Offline maps</h2>
        <p className="mt-1 text-subhead text-secondary">
          Download before you travel and the map works with no connection. Rome covers the metro
          area to building level; Tuscany covers the hill towns and the roads between them.
        </p>
        <div className="plate mt-2 border border-default bg-card">
          {MAP_PACKS.map((city, i) => {
            const isDownloaded = downloaded.has(city.id);
            const pct = progress[city.id];
            const isDownloading = pct !== undefined;
            const isActive = city.id === activeCityId;
            return (
              <div key={city.id} className={i > 0 ? "border-t border-default" : ""}>
                <div className="flex min-h-[3.5rem] items-center gap-3 p-3">
                  <button
                    type="button"
                    onClick={() => void selectCity(city)}
                    className="min-h-[2.75rem] min-w-0 flex-1 rounded-lg text-left"
                    aria-label={`Show ${city.name} on the map`}
                  >
                    <span className="block text-callout font-bold">
                      {city.name} <span className="font-normal text-secondary">· {city.nameIt}</span>
                      {isActive ? (
                        <span className="ml-2 inline-block rounded-full bg-verde-tint px-2 py-1 text-caption font-bold uppercase tracking-wide text-verde-deep">
                          Viewing
                        </span>
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
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isDownloaded || isDownloading}
                    aria-label={`Offline map for ${city.name}`}
                    onClick={() => void togglePack(city)}
                    className="flex h-11 w-14 shrink-0 items-center justify-center rounded-lg"
                  >
                    <span
                      aria-hidden="true"
                      className={`relative h-8 w-[3.25rem] rounded-full transition-colors motion-reduce:transition-none ${
                        isDownloaded || isDownloading ? "bg-verde" : "bg-line"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-6 w-6 rounded-full bg-card shadow transition-transform motion-reduce:transition-none ${
                          isDownloaded || isDownloading ? "translate-x-[1.5rem]" : "translate-x-1"
                        }`}
                      />
                    </span>
                  </button>
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
                    <p className="text-callout font-medium text-ambra">{errors[city.id]}</p>
                    {!isDownloaded && !isDownloading ? (
                      <button
                        type="button"
                        onClick={() => void togglePack(city)}
                        className="mt-2 min-h-[2.75rem] rounded-xl border-2 border-verde px-4 text-callout font-bold text-verde active:bg-verde-tint"
                      >
                        Download again
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-footnote text-secondary">
          Downloads live in this browser's storage. iOS may evict them if the device runs low on
          space — re-download before you travel. Outside a downloaded city the map needs a
          connection. Map data © OpenStreetMap contributors.
        </p>
      </section>
    </div>
  );
}
