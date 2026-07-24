"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { FetchSource, PMTiles, Protocol } from "pmtiles";
import "maplibre-gl/dist/maplibre-gl.css";
import { AlertTriangle, Download, LocateFixed, Map as MapIcon, Minus, Plus } from "lucide-react";
import { MAP_PACKS, type MapPack } from "@/data/mapPacks";
import Link from "next/link";
import { denunciaNote } from "@/data/police";
import {
  CATEGORY_LABEL,
  badgeMarkup,
  buildBaseMarker,
  buildPoiMarker,
  mapPlaces,
  type MapPlace,
  type PoiCategory,
} from "@/lib/mapMarkers";
import { buildMapStyle } from "@/lib/mapStyle";
import { appleMapsDirectionsUrl } from "@/lib/maps";
import ActionRow, { type Action } from "@/components/ui/ActionRow";
import Badge from "@/components/ui/Badge";
import BottomSheet, { sheetHeights, type SheetDetent } from "@/components/ui/BottomSheet";
import Button from "@/components/ui/Button";
import Callout from "@/components/ui/Callout";
import { Field, FieldError, Input } from "@/components/ui/Field";
import NavTile from "@/components/ui/NavTile";
import Icon from "@/components/Icon";
import Switch from "@/components/ui/Switch";
import { bearingDeg, cardinal, formatKm, haversineKm } from "@/lib/geo";
import { saveLastFix } from "@/lib/lastFix";
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

function cityStyle(city: MapPack) {
  return buildMapStyle({ key: city.id, bounds: city.bbox, maxzoom: city.maxzoom });
}

/** maplibre-gl v5 renders with WebGL2; without it we show a notice, not a blank box. */
function webgl2Available(): boolean {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

/**
 * One protocol instance for the lifetime of the tab. Each pack keeps a
 * stable `pmtiles://<id>` key; protocol.add() swaps what backs it (IndexedDB
 * Blob when downloaded, HTTP range requests against /map-packs/ otherwise).
 */
const protocol = new Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

const ACTIVE_CITY_KEY = "sentinella-active-city";
const HOME_BASE_KEY = "sentinella-home-base";
const LEGEND_KEY = "sentinella-map-legend-off";
const SHEET_PEEK_PX = 96;

/** Legend chips: the actual mini markers, acting as category toggles. */
const LEGEND: { category: PoiCategory; label: string }[] = [
  { category: "er", label: "ERs" },
  { category: "embassy", label: "US help" },
  { category: "police", label: "Police" },
];

/** Hidden categories persist for the session only. */
function loadHiddenCategories(): Set<PoiCategory> {
  try {
    const raw = window.sessionStorage.getItem(LEGEND_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as PoiCategory[]);
  } catch {
    return new Set();
  }
}

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

function packContains(pack: MapPack, lng: number, lat: number): boolean {
  const [w, s, e, n] = pack.bbox;
  return lng >= w && lng <= e && lat >= s && lat <= n;
}

/**
 * Auto-selection: the best pack for a point. Core packs (deep city detail)
 * always beat the region pack; downloaded beats streamable; deeper maxzoom
 * breaks remaining ties. Offline, only downloaded packs are candidates
 * unless `anyState` asks for the best pack regardless of availability
 * (used to decide which download to offer). Returns null when nothing
 * covers the point.
 */
function bestPackFor(
  lng: number,
  lat: number,
  downloadedIds: Set<string>,
  online: boolean,
  anyState = false,
): MapPack | null {
  const candidates = MAP_PACKS.filter(
    (p) => packContains(p, lng, lat) && (anyState || online || downloadedIds.has(p.id)),
  );
  if (candidates.length === 0) return null;
  const core = candidates.filter((p) => p.kind === "core");
  const pool = core.length > 0 ? core : candidates;
  pool.sort(
    (a, b) =>
      Number(downloadedIds.has(b.id)) - Number(downloadedIds.has(a.id)) ||
      b.maxzoom - a.maxzoom,
  );
  return pool[0];
}

/** CSS zoom bucket for the marker system: below z11 badges shrink to
 *  24px dots (color + shape survive); z13+ reveals the short names. */
function zoomBucket(zoom: number): "mini" | "plain" | "labeled" {
  return zoom >= 13 ? "labeled" : zoom >= 11 ? "plain" : "mini";
}

function formatSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Points the pack's pmtiles:// key at its data. Downloaded-first: a stored
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
  const mapAreaRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const geolocateRef = useRef<maplibregl.GeolocateControl | null>(null);
  const abortersRef = useRef(new Map<string, AbortController>());
  const persistRequestedRef = useRef(false);
  /** Live copies for map event handlers (state closures go stale). */
  const downloadedRef = useRef<Set<string>>(new Set());
  const activeCityRef = useRef<string>(MAP_PACKS[0].id);
  const baseMarkerRef = useRef<maplibregl.Marker | null>(null);
  /** Marker elements by place id, for selection + category toggles. */
  const poiElsRef = useRef(new Map<string, HTMLButtonElement>());
  /** Live copy of hidden categories for the async init path. */
  const hiddenRef = useRef<Set<PoiCategory>>(new Set());

  const [downloaded, setDownloaded] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeCityId, setActiveCityId] = useState<string>(MAP_PACKS[0].id);
  const [center, setCenter] = useState<[number, number]>(MAP_PACKS[0].center);
  const [online, setOnline] = useState(true);
  const [fix, setFix] = useState<Fix | null>(null);
  const [locating, setLocating] = useState(false);
  const [mapUnavailable, setMapUnavailable] = useState<string | null>(null);
  /** One quiet in-UI notice for partial map failures (tiles, glyphs). */
  const [mapNotice, setMapNotice] = useState<string | null>(null);
  const [gpsDenied, setGpsDenied] = useState(false);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<MapPlace | null>(null);
  /** Legend toggles: hidden marker categories (all visible by default). */
  const [hiddenCategories, setHiddenCategories] = useState<Set<PoiCategory>>(
    () => (typeof window === "undefined" ? new Set() : loadHiddenCategories()),
  );
  const [base, setBase] = useState<HomeBase | null>(null);
  const [baseName, setBaseName] = useState("Hotel");
  const [detent, setDetent] = useState<SheetDetent>("peek");
  const [navOffset, setNavOffset] = useState(72);
  const [mapAreaH, setMapAreaH] = useState(0);
  /** Bumped to (re)initialize the map, e.g. after the first pack downloads
   *  in the offline-with-nothing state where no map could be created. */
  const [initNonce, setInitNonce] = useState(0);

  /** Nearest 24h ER by straight-line distance — recomputed per GPS fix. */
  const nearestEr = useMemo(() => {
    if (!fix) return null;
    let best: { poi: MapPlace; km: number; bearing: number } | null = null;
    for (const poi of mapPlaces) {
      if (poi.category !== "er") continue;
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
    downloadedRef.current = downloaded;
  }, [downloaded]);

  // The map screen owns the viewport: no page scroll behind it.
  useEffect(() => {
    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  // The screen ends where the bottom nav begins — measured, because nav
  // height grows with Dynamic Type (labels wrap, never truncate).
  useEffect(() => {
    const nav = document.querySelector('nav[aria-label="Main"]');
    if (!nav) return;
    const measure = () => setNavOffset((nav as HTMLElement).offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(nav);
    return () => ro.disconnect();
  }, []);

  // Track the map area's height for sheet detents and FAB placement.
  useEffect(() => {
    const el = mapAreaRef.current;
    if (!el) return;
    const measure = () => setMapAreaH(el.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setOnline(navigator.onLine);
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  /** Re-point the pmtiles key and reload the style for the given pack. */
  async function switchToPack(city: MapPack) {
    activeCityRef.current = city.id;
    setActiveCityId(city.id);
    window.localStorage.setItem(ACTIVE_CITY_KEY, city.id);
    await registerCitySource(city, downloadedRef.current.has(city.id));
    mapRef.current?.setStyle(cityStyle(city), { diff: false });
  }

  /**
   * Auto pack selection: after every camera move, the best pack for the
   * viewport center wins (core over region, downloaded over streamed).
   * The user never juggles sources by hand.
   */
  function evaluateBestPack() {
    const map = mapRef.current;
    if (!map) return;
    const c = map.getCenter();
    setCenter([c.lng, c.lat]);
    const best = bestPackFor(c.lng, c.lat, downloadedRef.current, navigator.onLine);
    if (best && best.id !== activeCityRef.current) void switchToPack(best);
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (mapRef.current) return; // strict-mode / re-init guard

      if (!webgl2Available()) {
        setMapUnavailable(
          "This browser can't draw the map (WebGL unavailable). Emergency numbers and the guide still work — and your GPS coordinates show on the check-in screen.",
        );
        return;
      }

      const storedIds = await listStoredPackIds();
      const saved = window.localStorage.getItem(ACTIVE_CITY_KEY);
      let city = MAP_PACKS.find((c) => c.id === saved) ?? MAP_PACKS[0];

      // Deterministic offline: never stream with no connection. Fall back
      // to a downloaded pack; with nothing downloaded the map overlay
      // explains and offers the download.
      if (!navigator.onLine && !storedIds.includes(city.id)) {
        const fallback = MAP_PACKS.find((c) => storedIds.includes(c.id));
        if (fallback) {
          city = fallback;
        } else {
          setDownloaded(new Set(storedIds));
          setCenter(city.center);
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
      downloadedRef.current = new Set(storedIds);
      setActiveCityId(city.id);
      activeCityRef.current = city.id;
      setCenter(city.center);

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: cityStyle(city),
        center: city.center,
        zoom: 12.5,
        minZoom: 4,
        maxZoom: 17.5,
        attributionControl: false,
        // North is always up: rotated maps disorient. No pitch either.
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
      });
      map.touchZoomRotate.disableRotation();
      // Collapsed attribution, bottom-left, raised above the sheet's peek
      // strip (see .map-screen CSS) so it never overlaps the sheet.
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

      // A few POI kinds in the full flavor have no icon in the v4 sprite
      // sheet (e.g. townhall). Register a small neutral dot for any missing
      // image so those POIs still label cleanly instead of warning.
      map.on("styleimagemissing", (e) => {
        if (map.hasImage(e.id)) return;
        const size = 8;
        const data = new Uint8Array(size * size * 4);
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const dx = x - size / 2 + 0.5;
            const dy = y - size / 2 + 0.5;
            if (dx * dx + dy * dy > (size / 2) * (size / 2)) continue;
            const i = (y * size + x) * 4;
            data[i] = 148; data[i + 1] = 158; data[i + 2] = 152; data[i + 3] = 255;
          }
        }
        map.addImage(e.id, { width: size, height: size, data });
      });

      // Tile/glyph failures become one quiet notice, not devtools spam.
      let noticed = false;
      map.on("error", () => {
        if (noticed) return;
        noticed = true;
        setMapNotice(
          "Some map data couldn't load. Downloaded areas keep working offline; outside them the map needs a connection.",
        );
      });

      // The geolocate control does the hard work (blue dot, tracking,
      // permissions); its own button is hidden and the 48px FAB triggers it.
      const geolocate = new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true, timeout: 30000 },
        trackUserLocation: true,
        showUserLocation: true,
      });
      map.addControl(geolocate, "top-left");
      geolocateRef.current = geolocate;
      geolocate.on("trackuserlocationstart", () => {
        setLocating(true);
        setGpsNotice(null);
      });
      geolocate.on("geolocate", (e: GeolocationPosition) => {
        setLocating(false);
        setGpsDenied(false);
        setFix({ lat: e.coords.latitude, lng: e.coords.longitude, accuracyM: e.coords.accuracy });
        saveLastFix(e.coords.latitude, e.coords.longitude);
      });
      geolocate.on("error", (e: GeolocationPositionError) => {
        setLocating(false);
        if (e?.code === 1) {
          setGpsDenied(true);
          setGpsNotice(null);
        } else {
          setGpsNotice(
            "Couldn't get a GPS fix. Stand outdoors with a clear view of the sky and try again.",
          );
        }
      });

      // Safety POI overlay: DOM markers survive style swaps between packs,
      // and the data + artwork are bundled (inline SVG) — fully offline.
      poiElsRef.current.clear();
      for (const place of mapPlaces) {
        const el = buildPoiMarker(place);
        if (hiddenRef.current.has(place.category)) el.style.display = "none";
        el.addEventListener("click", (ev) => {
          ev.stopPropagation();
          setSelectedPoi(place);
          setDetent("half");
          mapRef.current?.easeTo({ center: place.lngLat });
        });
        poiElsRef.current.set(place.id, el);
        new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat(place.lngLat)
          .addTo(map);
      }

      // Marker zoom buckets are CSS-driven off this attribute.
      const applyBucket = () => {
        if (containerRef.current) containerRef.current.dataset.zoom = zoomBucket(map.getZoom());
      };
      applyBucket();
      map.on("zoom", applyBucket);

      map.on("moveend", evaluateBestPack);

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
      geolocateRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initNonce]);

  // Keep the home-base marker in sync with the saved base.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    baseMarkerRef.current?.remove();
    baseMarkerRef.current = null;
    if (base) {
      const el = buildBaseMarker(`Home base: ${base.name}`);
      baseMarkerRef.current = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([base.lng, base.lat])
        .addTo(map);
    }
  }, [base]);

  // Selected marker scales 1.15x with a stronger shadow (CSS, data-driven).
  useEffect(() => {
    poiElsRef.current.forEach((el, id) => {
      el.dataset.selected = String(id === selectedPoi?.id);
    });
  }, [selectedPoi]);

  // Legend toggles hide whole categories; markers stay mounted (cheap,
  // and their state survives). The async init path reads hiddenRef.
  useEffect(() => {
    hiddenRef.current = hiddenCategories;
    poiElsRef.current.forEach((el) => {
      const cat = el.dataset.category as PoiCategory;
      el.style.display = hiddenCategories.has(cat) ? "none" : "";
    });
  }, [hiddenCategories]);

  function toggleCategory(category: PoiCategory) {
    setHiddenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      try {
        window.sessionStorage.setItem(LEGEND_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // Session persistence is a nicety; the toggle still works.
      }
      return next;
    });
    if (selectedPoi?.category === category) setSelectedPoi(null);
  }

  /** Straight-line distance + bearing from the fix to the tapped marker. */
  const selectedReadout = useMemo(() => {
    if (!fix || !selectedPoi) return null;
    return {
      km: haversineKm(fix.lat, fix.lng, selectedPoi.lngLat[1], selectedPoi.lngLat[0]),
      bearing: bearingDeg(fix.lat, fix.lng, selectedPoi.lngLat[1], selectedPoi.lngLat[0]),
    };
  }, [fix, selectedPoi]);

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

  /** Re-point the active pack's source and force the style to re-read it. */
  async function refreshActiveSource(city: MapPack, useStoredBlob: boolean) {
    await registerCitySource(city, useStoredBlob);
    mapRef.current?.setStyle(cityStyle(city), { diff: false });
  }

  /**
   * Row tap = navigation, not source juggling: the camera flies to the
   * pack's area and auto-selection (moveend) picks the right source.
   */
  function goToPack(city: MapPack) {
    if (!navigator.onLine && !downloaded.has(city.id)) {
      setErrors((e) => ({
        ...e,
        [city.id]: `${city.name} isn't downloaded, and there's no connection to stream it. Download it when you're back online.`,
      }));
      return;
    }
    mapRef.current?.jumpTo({ center: city.center, zoom: city.kind === "region" ? 9 : 13 });
    setDetent("peek");
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
      const nextIds = new Set(downloadedRef.current);
      nextIds.delete(city.id);
      downloadedRef.current = nextIds;
      if (city.id === activeCityRef.current) await refreshActiveSource(city, false);
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
      downloadedRef.current = new Set(downloadedRef.current).add(city.id);
      if (!mapRef.current) {
        // First pack arrived while the map couldn't start (offline, nothing
        // downloaded) — initialize it now.
        setInitNonce((n) => n + 1);
      } else if (city.id === activeCityRef.current) {
        await refreshActiveSource(city, true);
      } else {
        // A just-downloaded core pack may now be the best for the viewport.
        evaluateBestPack();
      }
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

  const activePack = MAP_PACKS.find((p) => p.id === activeCityId);

  /** The pack the current viewport needs, regardless of download state —
   *  drives the map-surface overlays ("download Florence for this area"). */
  const coveringPack = useMemo(
    () => bestPackFor(center[0], center[1], downloaded, online, true),
    [center, downloaded, online],
  );

  const coveringDownloading =
    coveringPack !== null && progress[coveringPack.id] !== undefined;
  /** Overlay states in priority order; null = the map can render here. */
  const surfaceState = mapUnavailable
    ? ("unavailable" as const)
    : !coveringPack
      ? ("outside" as const)
      : coveringDownloading
        ? ("downloading" as const)
        : !downloaded.has(coveringPack.id) && !online
          ? ("needs-pack" as const)
          : null;

  const heights = sheetHeights(mapAreaH, SHEET_PEEK_PX);
  const fabBottom = heights[detent] + 16;

  return (
    <div
      className="map-screen fixed inset-x-0 top-0 z-30 bg-page"
      style={{ bottom: navOffset }}
    >
      <div className="mx-auto flex h-full w-full max-w-md flex-col">
        <header className="flex items-center justify-between border-b border-default px-4 py-2">
          <span className="flex items-center gap-2">
            <NavTile feature="map" />
            <h1 className="text-headline">Map</h1>
          </span>
          <p className="text-footnote text-secondary">
            {online ? "Works offline once a pack is downloaded" : "Offline"}
          </p>
        </header>

        <div ref={mapAreaRef} className="relative min-h-0 flex-1 overflow-hidden">
          {/* h-full, not inset-0: maplibre-gl.css forces position:relative
              on the container, which would collapse an absolutely-inset box. */}
          <div
            ref={containerRef}
            className="h-full w-full bg-sunken"
            role="application"
            aria-label="City map with safety locations"
          />

          {/* Active pack chip + home-base bearing chip. */}
          {!surfaceState ? (
            <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-2">
              <p
                className="rounded-full border border-default bg-card/95 px-3 py-1.5 text-footnote font-semibold text-secondary"
                role="status"
              >
                {activePack?.name ?? activeCityId} map
                {downloaded.has(activeCityId) ? " · offline" : ""}
              </p>
              {base && baseReadout ? (
                <p
                  className="flex items-center gap-2 rounded-full border border-default bg-card/95 px-3 py-2 text-footnote font-bold"
                  role="status"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 shrink-0 text-terracotta-600"
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
          ) : null}

          {/* 44px zoom controls, top-right. */}
          {!surfaceState ? (
            <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-xl border border-default bg-card">
              <button
                type="button"
                aria-label="Zoom in"
                onClick={() => mapRef.current?.zoomIn()}
                className="flex h-11 w-11 items-center justify-center active:bg-sunken"
              >
                <Icon icon={Plus} />
              </button>
              <span aria-hidden="true" className="h-px bg-line" />
              <button
                type="button"
                aria-label="Zoom out"
                onClick={() => mapRef.current?.zoomOut()}
                className="flex h-11 w-11 items-center justify-center active:bg-sunken"
              >
                <Icon icon={Minus} />
              </button>
            </div>
          ) : null}

          {/* Map-surface states: the map area itself says what's wrong and
              what to do — never a blank canvas. */}
          {surfaceState ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-page/60 p-6">
              <div className="plate w-full max-w-sm border border-default bg-card p-6 text-center">
                <span
                  aria-hidden="true"
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sunken text-icon-default"
                >
                  <Icon
                    icon={
                      surfaceState === "downloading"
                        ? Download
                        : surfaceState === "needs-pack"
                          ? Download
                          : surfaceState === "outside"
                            ? MapIcon
                            : AlertTriangle
                    }
                    size="lg"
                  />
                </span>
                {surfaceState === "unavailable" ? (
                  <p className="mt-3 text-subhead text-secondary">{mapUnavailable}</p>
                ) : surfaceState === "outside" ? (
                  <>
                    <p className="mt-3 text-headline">No map pack for this area</p>
                    <p className="mt-1 text-subhead text-secondary">
                      Sentinella carries offline maps for Rome, Florence, Siena, and the Tuscany
                      region.
                    </p>
                    <div className="mt-4 flex justify-center">
                      <Button
                        variant="tinted"
                        size="md"
                        onClick={() => goToPack(MAP_PACKS[0])}
                      >
                        Go to {MAP_PACKS[0].name}
                      </Button>
                    </div>
                  </>
                ) : surfaceState === "downloading" && coveringPack ? (
                  <>
                    <p className="mt-3 text-headline">
                      Downloading {coveringPack.name}… {Math.round((progress[coveringPack.id] ?? 0) * 100)}%
                    </p>
                    <div className="mt-3 h-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
                      <div
                        className="h-full rounded-full bg-verde transition-[width] motion-reduce:transition-none"
                        style={{ width: `${Math.round((progress[coveringPack.id] ?? 0) * 100)}%` }}
                      />
                    </div>
                  </>
                ) : coveringPack ? (
                  <>
                    <p className="mt-3 text-headline">
                      {errors[coveringPack.id]
                        ? "This pack needs a re-download"
                        : `No connection — ${coveringPack.name} isn't downloaded`}
                    </p>
                    <p className="mt-1 text-subhead text-secondary">
                      {errors[coveringPack.id] ||
                        "The map for this area streams online or works from a downloaded pack."}
                    </p>
                    <div className="mt-4 flex justify-center">
                      <Button variant="tinted" size="md" onClick={() => void togglePack(coveringPack)}>
                        Download {coveringPack.name} — {formatSize(coveringPack.sizeBytes)}
                      </Button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* 48px locate FAB, bottom-right, riding above the sheet. */}
          {!surfaceState && detent !== "full" ? (
            <button
              type="button"
              onClick={() => geolocateRef.current?.trigger()}
              aria-label="Show my position"
              className="absolute right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-default bg-card text-verde-deep active:bg-sunken"
              style={{ bottom: fabBottom, transition: "bottom 200ms ease-out" }}
            >
              {locating ? (
                <span
                  aria-hidden="true"
                  className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-verde motion-reduce:animate-none"
                />
              ) : (
                <Icon icon={LocateFixed} size="lg" />
              )}
            </button>
          ) : null}

          <BottomSheet
            detent={detent}
            onDetentChange={setDetent}
            peekHeight={SHEET_PEEK_PX}
            label="Map details"
          >
            {selectedPoi ? (
              <div>
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="eyebrow">{CATEGORY_LABEL[selectedPoi.category]}</p>
                    <h2 className="text-headline">{selectedPoi.name}</h2>
                    <p className="mt-1 text-footnote text-secondary">{selectedPoi.address}</p>
                    {selectedReadout ? (
                      <p className="mt-1 text-subhead">
                        <strong className="font-bold">
                          {formatKm(selectedReadout.km)} {cardinal(selectedReadout.bearing)}
                        </strong>{" "}
                        of you <span className="text-secondary">(straight line)</span>
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPoi(null)}
                    aria-label="Close place details"
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
                        label: "Directions",
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
                {selectedPoi.category === "police" ? (
                  <p className="mt-3 border-t border-default pt-3 text-subhead text-secondary">
                    {selectedPoi.notes ? <>{selectedPoi.notes} </> : null}
                    {denunciaNote}{" "}
                    <Link href="/emergency#robbed" className="text-link">
                      If you&apos;re robbed →
                    </Link>
                  </p>
                ) : null}
                <p className="mt-2 text-footnote text-secondary">
                  Calls work offline via the phone network. Directions need a connection.
                </p>
              </div>
            ) : (
              <div>
                {/* Peek strip: the legend IS the filter — each chip is the
                    actual mini marker and toggles its category. */}
                <section aria-label="Marker legend" className="mb-3">
                  <div className="flex flex-wrap gap-2">
                    {LEGEND.map(({ category, label }) => {
                      const on = !hiddenCategories.has(category);
                      return (
                        <button
                          key={category}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggleCategory(category)}
                          className={`legend-chip flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-subhead font-semibold ${
                            on
                              ? "border-strong bg-card text-primary"
                              : "border-default bg-sunken text-secondary"
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            dangerouslySetInnerHTML={{ __html: badgeMarkup(category) }}
                          />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-footnote text-secondary">
                    All markers work offline — tap one for call and directions.
                  </p>
                </section>

                {/* Your position, live. */}
                <section aria-label="Your position">
                  {fix ? (
                    <>
                      <p className="font-mono text-headline font-bold tabular-nums text-primary">
                        {fix.lat.toFixed(5)}, {fix.lng.toFixed(5)}{" "}
                        <span className="font-sans text-footnote font-normal text-secondary">
                          ±{Math.round(fix.accuracyM)} m
                        </span>
                      </p>
                      {nearestEr ? (
                        <p className="mt-1 text-subhead">
                          Nearest 24h ER:{" "}
                          <strong className="font-bold">{nearestEr.poi.shortName}</strong>,{" "}
                          {formatKm(nearestEr.km)} {cardinal(nearestEr.bearing)}{" "}
                          <span className="text-secondary">(straight line)</span>
                        </p>
                      ) : null}
                    </>
                  ) : locating ? (
                    <p className="flex items-center gap-2 text-subhead text-secondary">
                      <span
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-line border-t-verde motion-reduce:animate-none"
                      />
                      Getting a fix… without cell service the first one can take a minute
                      outdoors.
                    </p>
                  ) : (
                    <p className="text-subhead text-secondary">
                      GPS works with no signal — tap{" "}
                      <span className="font-semibold text-primary">locate</span> for your
                      position and the nearest ER.
                    </p>
                  )}

                  {gpsDenied ? (
                    <Callout className="mt-3">
                      Location permission is off for this site. On iPhone: Settings → Privacy &
                      Security → Location Services → Safari Websites (or Sentinella if installed
                      as an app) → While Using. Then tap locate again.
                    </Callout>
                  ) : null}
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
                      <Button variant="tinted" destructive size="md" onClick={removeBase}>
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
                          <Button variant="filled" size="md" onClick={saveBase} className="shrink-0">
                            Save spot
                          </Button>
                        </span>
                      </Field>
                      <p className="mt-2 text-footnote text-secondary">
                        Saves on this device only. A chip on the map then points back here —
                        which way is the hotel, at a glance.
                      </p>
                    </div>
                  ) : null}
                </section>

                {mapNotice ? <Callout className="mt-4">{mapNotice}</Callout> : null}

                <section className="mt-6" aria-label="Offline maps">
                  <h2 className="text-headline">Offline maps</h2>
                  <p className="mt-1 text-footnote text-secondary">
                    City packs carry street names where you walk; the region pack covers driving
                    routes. The map picks the best downloaded pack automatically.
                  </p>
                  <ul className="mt-2">
                    {MAP_PACKS.map((city, i) => {
                      const isDownloaded = downloaded.has(city.id);
                      const pct = progress[city.id];
                      const isDownloading = pct !== undefined;
                      const isActive = city.id === activeCityId;
                      return (
                        <li key={city.id} className={i > 0 ? "border-t border-default" : ""}>
                          <div className="flex min-h-14 items-center gap-3 py-2">
                            <button
                              type="button"
                              onClick={() => goToPack(city)}
                              className="min-h-control min-w-0 flex-1 rounded-xl text-left"
                              aria-label={`Go to ${city.name} on the map`}
                            >
                              <span className="block text-callout font-bold">
                                {city.name}{" "}
                                <span className="font-normal text-secondary">· {city.nameIt}</span>
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
                            <div className="pb-2" aria-hidden="true">
                              <div className="h-1 overflow-hidden rounded-full bg-line">
                                <div
                                  className="h-full rounded-full bg-verde transition-[width] motion-reduce:transition-none"
                                  style={{ width: `${Math.round((pct ?? 0) * 100)}%` }}
                                />
                              </div>
                            </div>
                          ) : null}
                          {errors[city.id] ? (
                            <div className="pb-2">
                              <FieldError>{errors[city.id]}</FieldError>
                              {!isDownloaded && !isDownloading ? (
                                <Button
                                  variant="tinted"
                                  size="md"
                                  onClick={() => void togglePack(city)}
                                  className="mt-2"
                                >
                                  Download again
                                </Button>
                              ) : null}
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-2 text-footnote text-secondary">
                    Downloads live in this browser's storage. iOS may evict them if the device
                    runs low on space — re-download before you travel.
                  </p>
                </section>
              </div>
            )}
          </BottomSheet>
        </div>
      </div>
    </div>
  );
}
