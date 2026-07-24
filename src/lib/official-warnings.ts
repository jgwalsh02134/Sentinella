/**
 * Server-side ingestion of official emergency warnings. Never import from
 * client components. Three sources, each verified live 2026-07-24:
 *
 *  - MeteoAlarm (EUMETNET) legacy ATOM feed for Italy — republishes the
 *    Protezione Civile network's weather warnings as CAP entries:
 *    feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-italy
 *  - INGV (Italy's seismic authority) FDSN event service:
 *    webservices.ingv.it/fdsnws/event/1/query (GeoJSON)
 *  - GDACS (EU/UN Global Disaster Alert and Coordination System) RSS:
 *    www.gdacs.org/xml/rss.xml
 *
 * Contracts, non-negotiable:
 *  - Parse defensively: a feed format change degrades to the last-good
 *    rows in official_warnings, never to a crash.
 *  - NEVER fabricate or infer a warning that isn't in a feed. Severity is
 *    copied from the source (or left null for quakes), not guessed.
 *  - Dedupe on stable per-feed IDs, so refreshes never duplicate.
 *  - Warnings expire automatically: reads filter on expires_at.
 *  - Every refresh attempt is recorded in warning_checks per source, so
 *    the UI can say "checked Xm ago" and show per-source failures even
 *    when there are zero active warnings (the normal case).
 */
import { and, gt, inArray, isNull, notInArray, or, sql, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  officialWarnings,
  warningChecks,
  type OfficialWarning,
  type WarningCheck,
} from "@/db/schema";

export const METEOALARM_FEED_URL =
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-italy";
export const INGV_BASE_URL = "https://webservices.ingv.it/fdsnws/event/1/query";
export const GDACS_FEED_URL = "https://www.gdacs.org/xml/rss.xml";

/** Refresh cadences (Railway cron mirrors these; see README). */
export const CADENCE_SECONDS: Record<WarningSource, number> = {
  meteoalarm: 30 * 60,
  ingv: 30 * 60,
  gdacs: 60 * 60,
};

export type WarningSource = "meteoalarm" | "ingv" | "gdacs";

/** Quakes below this stay out of the table entirely (spec: M ≥ 4.0). */
export const INGV_MIN_MAGNITUDE = 4.0;
/** Quakes shown/pushed as significant (home banner, notifications). */
export const QUAKE_BANNER_MAGNITUDE = 4.5;
/** How long a quake stays in the active list. */
const QUAKE_ACTIVE_HOURS = 48;

/** Bounding box covering Lazio + Tuscany for the INGV query. */
const INGV_BBOX = { minLat: 40.8, maxLat: 44.5, minLng: 9.6, maxLng: 14.1 };

/** Administrative-region boxes for tagging GDACS country-level events. */
const REGION_BOXES: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
  Lazio: { minLat: 40.78, maxLat: 42.84, minLng: 11.45, maxLng: 14.03 },
  Toscana: { minLat: 42.24, maxLat: 44.47, minLng: 9.69, maxLng: 12.38 },
};

/** Italian license-plate province codes → region, for INGV place strings. */
const PROVINCE_REGION: Record<string, string> = {
  RM: "Lazio", VT: "Lazio", RI: "Lazio", FR: "Lazio", LT: "Lazio",
  FI: "Toscana", SI: "Toscana", AR: "Toscana", GR: "Toscana", LI: "Toscana",
  PI: "Toscana", PO: "Toscana", PT: "Toscana", MS: "Toscana", LU: "Toscana",
};

/* ------------------------------ XML utilities ------------------------------ */
/* Dependency-free, like us-advisories: both XML feeds are simple enough
 * for tolerant regex extraction, and every helper returns "" instead of
 * throwing on a missing tag. Namespaced tags (cap:event) work as-is. */

function blocks(xml: string, tag: string): string[] {
  return xml.match(new RegExp(`<${tag}[\\s>][\\s\\S]*?</${tag}>`, "g")) ?? [];
}

function tagText(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  if (!m) return "";
  const inner = m[1];
  const cdata = inner.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  return (cdata ? cdata[1] : inner).trim();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function parseDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/* -------------------------------- MeteoAlarm ------------------------------- */

export type ParsedWarning = {
  source: WarningSource;
  externalId: string;
  kind: string;
  severity: string | null;
  title: string;
  area: string;
  regions: string[];
  magnitude: number | null;
  depthKm: number | null;
  lat: number | null;
  lng: number | null;
  onsetAt: Date | null;
  expiresAt: Date | null;
  publishedAt: Date | null;
  url: string;
};

/** CAP severity → MeteoAlarm color. Copied, never inferred. */
const CAP_SEVERITY_COLOR: Record<string, string> = {
  moderate: "yellow",
  severe: "orange",
  extreme: "red",
};

/**
 * Parses the Italy legacy-ATOM feed and keeps Lazio/Toscana entries. The
 * stable ID is area+hazard (one active warning per hazard per region);
 * CAP updates for the same hazard overwrite instead of duplicating.
 */
export function parseMeteoalarm(xml: string): ParsedWarning[] {
  const out: ParsedWarning[] = [];
  for (const entry of blocks(xml, "entry")) {
    const area = decodeEntities(tagText(entry, "cap:areaDesc"));
    if (!/^(lazio|toscana)$/i.test(area)) continue;
    if (tagText(entry, "cap:status").toLowerCase() !== "actual") continue;
    if (tagText(entry, "cap:message_type").toLowerCase() === "cancel") continue;

    const severity = CAP_SEVERITY_COLOR[tagText(entry, "cap:severity").toLowerCase()] ?? null;
    // Minor/green entries are "no warning" — the feed includes them for
    // completeness; showing them would be noise, not safety.
    if (!severity) continue;

    const event = decodeEntities(tagText(entry, "cap:event"));
    // "Red High-temperature Warning" → "High-temperature"
    const kind =
      event.replace(/^(green|yellow|orange|red)\s+/i, "").replace(/\s+warning$/i, "").trim() ||
      "Weather";
    const geocode = tagText(entry, "cap:geocode").match(/<value>([^<]+)<\/value>/i)?.[1] ?? area;
    const regionName = /lazio/i.test(area) ? "Lazio" : "Toscana";

    out.push({
      source: "meteoalarm",
      externalId: `meteoalarm:${geocode}:${kind.toLowerCase().replace(/\s+/g, "-")}`,
      kind,
      severity,
      title: decodeEntities(tagText(entry, "title")) || `${kind} warning — ${area}`,
      area,
      regions: [regionName],
      magnitude: null,
      depthKm: null,
      lat: null,
      lng: null,
      onsetAt: parseDate(tagText(entry, "cap:onset")),
      expiresAt: parseDate(tagText(entry, "cap:expires")),
      publishedAt: parseDate(tagText(entry, "published")),
      url: `https://meteoalarm.org/en/live/region/IT`,
    });
  }
  return out;
}

/* ---------------------------------- INGV ---------------------------------- */

export function ingvQueryUrl(now: Date = new Date()): string {
  const start = new Date(+now - QUAKE_ACTIVE_HOURS * 60 * 60 * 1000);
  const params = new URLSearchParams({
    starttime: start.toISOString().slice(0, 19),
    endtime: now.toISOString().slice(0, 19),
    minmagnitude: String(INGV_MIN_MAGNITUDE),
    minlatitude: String(INGV_BBOX.minLat),
    maxlatitude: String(INGV_BBOX.maxLat),
    minlongitude: String(INGV_BBOX.minLng),
    maxlongitude: String(INGV_BBOX.maxLng),
    format: "geojson",
  });
  return `${INGV_BASE_URL}?${params}`;
}

/** "5 km SW Campello sul Clitunno (PG)" → region via the province code. */
function regionsFromPlace(place: string): string[] {
  const code = place.match(/\(([A-Z]{2})\)\s*$/)?.[1];
  const region = code ? PROVINCE_REGION[code] : undefined;
  return region ? [region] : [];
}

export function parseIngv(json: unknown): ParsedWarning[] {
  if (typeof json !== "object" || json === null) return [];
  const features = (json as { features?: unknown[] }).features;
  if (!Array.isArray(features)) return [];

  const out: ParsedWarning[] = [];
  for (const f of features) {
    const props = (f as { properties?: Record<string, unknown> }).properties ?? {};
    const coords = (f as { geometry?: { coordinates?: unknown[] } }).geometry?.coordinates ?? [];
    const eventId = props.eventId;
    const mag = typeof props.mag === "number" ? props.mag : null;
    const place = typeof props.place === "string" ? props.place : "Central Italy";
    // INGV FDSN times are UTC without a zone suffix.
    const time = typeof props.time === "string" ? parseDate(`${props.time}Z`) : null;
    if (eventId == null || mag === null || mag < INGV_MIN_MAGNITUDE || !time) continue;

    out.push({
      source: "ingv",
      externalId: `ingv:${eventId}`,
      kind: "earthquake",
      severity: null,
      title: `M ${mag.toFixed(1)} earthquake — ${place}`,
      area: place,
      regions: regionsFromPlace(place),
      magnitude: mag,
      depthKm: typeof coords[2] === "number" ? coords[2] : null,
      lat: typeof coords[1] === "number" ? coords[1] : null,
      lng: typeof coords[0] === "number" ? coords[0] : null,
      onsetAt: time,
      // A quake "expires" out of the active list 48 h after it happened.
      expiresAt: new Date(+time + QUAKE_ACTIVE_HOURS * 60 * 60 * 1000),
      publishedAt: time,
      url: `https://terremoti.ingv.it/event/${eventId}`,
    });
  }
  return out;
}

/* ---------------------------------- GDACS ---------------------------------- */

const GDACS_EVENT_KIND: Record<string, string> = {
  EQ: "earthquake",
  TC: "tropical cyclone",
  FL: "flood",
  DR: "drought",
  WF: "wildfire",
  VO: "volcanic activity",
  TS: "tsunami",
};

/** bbox format: "lonmin lonmax latmin latmax". */
function regionsFromBbox(bbox: string): string[] {
  const nums = bbox.split(/\s+/).map(Number);
  if (nums.length !== 4 || nums.some((n) => Number.isNaN(n))) return [];
  const [lngMin, lngMax, latMin, latMax] = nums;
  return Object.entries(REGION_BOXES)
    .filter(
      ([, b]) => lngMin <= b.maxLng && lngMax >= b.minLng && latMin <= b.maxLat && latMax >= b.minLat,
    )
    .map(([name]) => name);
}

/** Italy-touching orange/red events only — the wide net, kept narrow. */
export function parseGdacs(xml: string): ParsedWarning[] {
  const out: ParsedWarning[] = [];
  for (const item of blocks(xml, "item")) {
    const level = tagText(item, "gdacs:alertlevel").toLowerCase();
    if (level !== "orange" && level !== "red") continue;
    const iso3 = tagText(item, "gdacs:iso3");
    const country = decodeEntities(tagText(item, "gdacs:country"));
    if (iso3 !== "ITA" && !/\bItaly\b/i.test(country)) continue;

    const guid = tagText(item, "guid");
    if (!guid) continue;
    const eventType = tagText(item, "gdacs:eventtype");

    out.push({
      source: "gdacs",
      externalId: `gdacs:${guid}`,
      kind: GDACS_EVENT_KIND[eventType] ?? (eventType || "disaster").toLowerCase(),
      severity: level,
      title: decodeEntities(tagText(item, "title")).slice(0, 300),
      area: "Italy",
      regions: regionsFromBbox(tagText(item, "gdacs:bbox")),
      magnitude: null,
      depthKm: null,
      lat: null,
      lng: null,
      onsetAt: parseDate(tagText(item, "gdacs:fromdate")),
      expiresAt: parseDate(tagText(item, "gdacs:todate")),
      publishedAt: parseDate(tagText(item, "pubDate")),
      url: decodeEntities(tagText(item, "link")) || "https://www.gdacs.org/",
    });
  }
  return out;
}

/* ------------------------------ refresh machinery ------------------------------ */

async function upsertWarnings(items: ParsedWarning[]): Promise<OfficialWarning[]> {
  if (items.length === 0) return [];
  const ids = items.map((i) => i.externalId);
  const existing = await db
    .select({ externalId: officialWarnings.externalId })
    .from(officialWarnings)
    .where(inArray(officialWarnings.externalId, ids));
  const known = new Set(existing.map((e) => e.externalId));

  const fresh: OfficialWarning[] = [];
  for (const item of items) {
    const [row] = await db
      .insert(officialWarnings)
      .values({ ...item, fetchedAt: new Date() })
      .onConflictDoUpdate({
        target: officialWarnings.externalId,
        set: {
          kind: item.kind,
          severity: item.severity,
          title: item.title,
          area: item.area,
          regions: item.regions,
          magnitude: item.magnitude,
          depthKm: item.depthKm,
          lat: item.lat,
          lng: item.lng,
          onsetAt: item.onsetAt,
          expiresAt: item.expiresAt,
          publishedAt: item.publishedAt,
          url: item.url,
          fetchedAt: new Date(),
        },
      })
      .returning();
    if (!known.has(item.externalId)) fresh.push(row);
  }
  return fresh;
}

async function recordCheck(source: WarningSource, ok: boolean, error?: string) {
  await db
    .insert(warningChecks)
    .values({ source, ok, error: error ?? null, checkedAt: new Date() })
    .onConflictDoUpdate({
      target: warningChecks.source,
      set: { ok, error: error ?? null, checkedAt: new Date() },
    })
    .catch((err) => console.error(`[warnings] check record failed for ${source}:`, err));
}

/** Skip a non-forced refresh while the cadence window is still fresh. */
async function withinCadence(source: WarningSource): Promise<boolean> {
  const [row] = await db.select().from(warningChecks).where(eq(warningChecks.source, source));
  if (!row) return false;
  const age = Date.now() - +row.checkedAt;
  // Failed checks retry sooner, but never hammer a dead feed per-request.
  const window = row.ok ? CADENCE_SECONDS[source] * 1000 : 5 * 60 * 1000;
  return age < window;
}

const FETCH_OPTS: RequestInit = {
  headers: { "User-Agent": "Sentinella travel-safety app (server)" },
  cache: "no-store",
};

async function fetchText(url: string): Promise<{ status: number; body: string }> {
  const res = await fetch(url, { ...FETCH_OPTS, signal: AbortSignal.timeout(20_000) });
  return { status: res.status, body: res.status === 204 ? "" : await res.text() };
}

async function refreshMeteoalarm(): Promise<OfficialWarning[]> {
  const { status, body } = await fetchText(METEOALARM_FEED_URL);
  if (status !== 200) throw new Error(`HTTP ${status}`);
  // A response without an ATOM root is a format change, not "no warnings".
  if (!/<feed[\s>]/.test(body)) throw new Error("not an ATOM feed");
  const items = parseMeteoalarm(body);
  const fresh = await upsertWarnings(items);

  // The feed is a full snapshot of Italy's active warnings: any stored
  // Lazio/Toscana warning that vanished from it (expired or cancelled
  // upstream) is closed out now rather than lingering until expiry.
  const presentIds = items.map((i) => i.externalId);
  await db
    .update(officialWarnings)
    .set({ expiresAt: new Date() })
    .where(
      and(
        eq(officialWarnings.source, "meteoalarm"),
        presentIds.length > 0 ? notInArray(officialWarnings.externalId, presentIds) : undefined,
        or(isNull(officialWarnings.expiresAt), gt(officialWarnings.expiresAt, new Date())),
      ),
    );
  return fresh;
}

async function refreshIngv(): Promise<OfficialWarning[]> {
  const res = await fetch(ingvQueryUrl(), {
    ...FETCH_OPTS,
    signal: AbortSignal.timeout(20_000),
  });
  // FDSN services answer 204 (or a configured 404) when no events match —
  // that's a successful "no earthquakes", not an error.
  if (res.status === 204 || res.status === 404) return [];
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return upsertWarnings(parseIngv(await res.json()));
}

async function refreshGdacs(): Promise<OfficialWarning[]> {
  const { status, body } = await fetchText(GDACS_FEED_URL);
  if (status !== 200) throw new Error(`HTTP ${status}`);
  if (!/<rss[\s>]/.test(body)) throw new Error("not an RSS feed");
  return upsertWarnings(parseGdacs(body));
}

const REFRESHERS: Record<WarningSource, () => Promise<OfficialWarning[]>> = {
  meteoalarm: refreshMeteoalarm,
  ingv: refreshIngv,
  gdacs: refreshGdacs,
};

export type WarningsRefreshResult = {
  status: Record<WarningSource, "ok" | "failed" | "skipped">;
  /** Rows new to the table this refresh (push-notification candidates). */
  newItems: OfficialWarning[];
};

/**
 * Refreshes the given sources (default: all three). Never throws; each
 * source fails independently and the table keeps its last-good rows.
 */
export async function refreshWarnings(
  sources: WarningSource[] = ["meteoalarm", "ingv", "gdacs"],
  opts: { force?: boolean } = {},
): Promise<WarningsRefreshResult> {
  const status = { meteoalarm: "skipped", ingv: "skipped", gdacs: "skipped" } as WarningsRefreshResult["status"];
  const newItems: OfficialWarning[] = [];

  await Promise.all(
    sources.map(async (source) => {
      try {
        if (!opts.force && (await withinCadence(source))) return;
        const fresh = await REFRESHERS[source]();
        newItems.push(...fresh);
        status[source] = "ok";
        await recordCheck(source, true);
      } catch (err) {
        status[source] = "failed";
        console.error(`[warnings] refresh failed for ${source}:`, err);
        await recordCheck(source, false, err instanceof Error ? err.message : "failed");
      }
    }),
  );

  return { status, newItems };
}

/* --------------------------------- reading --------------------------------- */

export type SourceStatus = {
  source: WarningSource;
  checkedAt: string | null;
  ok: boolean;
  /** True when the last check is older than 2× the source's cadence. */
  stale: boolean;
};

export type ActiveWarnings = {
  /** Unexpired warnings, most severe first. */
  warnings: OfficialWarning[];
  checks: SourceStatus[];
};

const SEVERITY_RANK: Record<string, number> = { red: 0, orange: 1, yellow: 2 };

function rank(w: OfficialWarning): number {
  if (w.severity) return SEVERITY_RANK[w.severity] ?? 3;
  // Quakes: significant ones sort with orange, the rest with yellow.
  return (w.magnitude ?? 0) >= QUAKE_BANNER_MAGNITUDE ? 1 : 2;
}

export async function getActiveWarnings(): Promise<ActiveWarnings> {
  const now = new Date();
  const rows = await db
    .select()
    .from(officialWarnings)
    .where(or(isNull(officialWarnings.expiresAt), gt(officialWarnings.expiresAt, now)))
    .orderBy(sql`coalesce(${officialWarnings.onsetAt}, ${officialWarnings.publishedAt}) desc`)
    .limit(50);
  rows.sort((a, b) => rank(a) - rank(b));

  const checkRows: WarningCheck[] = await db.select().from(warningChecks);
  const bySource = new Map(checkRows.map((c) => [c.source, c]));
  const checks: SourceStatus[] = (["meteoalarm", "ingv", "gdacs"] as const).map((source) => {
    const c = bySource.get(source);
    return {
      source,
      checkedAt: c ? c.checkedAt.toISOString() : null,
      ok: c?.ok ?? false,
      stale: c ? Date.now() - +c.checkedAt > 2 * CADENCE_SECONDS[source] * 1000 : true,
    };
  });

  return { warnings: rows, checks };
}

/** True when the warning should trip the Home banner (orange/red or M≥4.5). */
export function isBannerWorthy(w: OfficialWarning): boolean {
  if (w.severity === "orange" || w.severity === "red") return true;
  return w.source === "ingv" && (w.magnitude ?? 0) >= QUAKE_BANNER_MAGNITUDE;
}
