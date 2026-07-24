/**
 * DOM markers for the /map safety overlay — built as plain elements for
 * maplibregl.Marker. Everything is inline SVG: offline is a guarantee,
 * so markers never fetch sprites or images.
 *
 * Redundant encoding, by design: every category differs by COLOR + SHAPE
 * + GLYPH — never color alone. And no marker is signal red: markers are
 * wayfinding, not emergency actions.
 *
 *  - 24h ERs: the Italian hospital road sign — blue square, bold white H.
 *    The map teaches the exact sign travelers see on the street.
 *    (Deliberately NOT a green cross — that means pharmacy in Italy.)
 *  - Embassies & consulates: navy pin, white flag glyph; the U.S. posts
 *    carry a small US flag so they read at a glance among the others.
 *  - Police: dark-blue shield, white star — shield vs square keeps it
 *    apart from the hospital blue even for colorblind readers.
 *
 * Anatomy: 36px badge, 2px white stroke + soft shadow for separation
 * from any basemap, inside a 44px invisible hit area. Zoom buckets and
 * the selected state are pure CSS, driven by data attributes (see the
 * "Map POI markers" block in globals.css).
 */

import { policeStations } from "@/data/police";
import { safetyPois } from "@/data/safetyPois";
import { MARKER_COLORS } from "@/lib/mapStyle";

export type PoiCategory = "er" | "embassy" | "police";

export type MapPlace = {
  id: string;
  category: PoiCategory;
  name: string;
  /** Short label rendered under the marker from z13. */
  shortName: string;
  city: string;
  address: string;
  /** [lng, lat] */
  lngLat: [number, number];
  phone?: string;
  dial?: string;
  poisonPhone?: string;
  poisonDial?: string;
  /** U.S. posts show the small US flag on the pin. */
  usFlag?: boolean;
  /** Traveler context (police: hours quirks, what the post is good for). */
  notes?: string;
  /** Staggers labels above the pin where places cluster (Rome embassies). */
  labelAbove?: boolean;
};

export const CATEGORY_LABEL: Record<PoiCategory, string> = {
  er: "24h emergency room",
  embassy: "Embassy / consulate",
  police: "Police station",
};

/** Spoken-out category phrase for marker aria-labels. */
const ARIA_PHRASE: Record<PoiCategory, string> = {
  er: "24-hour emergency room",
  embassy: "embassy or consulate",
  police: "police station",
};

/**
 * One place list for the whole map: the existing safety POIs (ERs +
 * embassies) merged with the verified police stations. Both files stay
 * the single sources of truth — this is a projection, not a copy.
 */
export const mapPlaces: MapPlace[] = [
  ...safetyPois.map(
    (p, i): MapPlace => ({
      id: p.id,
      category: p.kind,
      name: p.name,
      shortName: p.shortName,
      city: p.city,
      address: p.address,
      lngLat: p.lngLat,
      phone: p.phone,
      dial: p.dial,
      poisonPhone: p.poisonPhone,
      poisonDial: p.poisonDial,
      usFlag: p.kind === "embassy" && p.id.startsWith("embassy-us"),
      labelAbove: p.kind === "embassy" && i % 2 === 0,
    }),
  ),
  ...policeStations.map(
    (s, i): MapPlace => ({
      id: s.id,
      category: "police",
      name: s.name,
      shortName: s.shortName,
      city: s.city,
      address: s.address,
      lngLat: s.lngLat,
      phone: s.phone,
      dial: s.dial,
      notes: s.notes,
      labelAbove: i % 2 === 1,
    }),
  ),
];

/* ---- Badge artwork (36×36, 2px white stroke) --------------------------- */

const ER_BADGE = `<svg viewBox="0 0 36 36" aria-hidden="true"><rect x="2" y="2" width="32" height="32" rx="7" fill="${MARKER_COLORS.er}" stroke="#fff" stroke-width="2"/><path fill="#fff" d="M11 9h4.5v6.5h5V9H25v18h-4.5v-7h-5v7H11z"/></svg>`;

const EMBASSY_BADGE = `<svg viewBox="0 0 36 36" aria-hidden="true"><path d="M18 2C11 2 5.4 7.6 5.4 14.6 5.4 24 18 34 18 34s12.6-10 12.6-19.4C30.6 7.6 25 2 18 2z" fill="${MARKER_COLORS.embassy}" stroke="#fff" stroke-width="2"/><g stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M14 21V8"/><path d="M14 8h8.5l-2 3.2 2 3.2H14"/></g></svg>`;

const POLICE_BADGE = `<svg viewBox="0 0 36 36" aria-hidden="true"><path d="M18 2.5 30.5 7.1v9.3c0 8.1-5.2 14.8-12.5 17.1C10.7 31.2 5.5 24.5 5.5 16.4V7.1z" fill="${MARKER_COLORS.police}" stroke="#fff" stroke-width="2"/><path fill="#fff" d="M18 10l1.76 4.57 4.9.27-3.81 3.09 1.26 4.73L18 20l-4.11 2.66 1.26-4.73-3.81-3.09 4.9-.27z"/></svg>`;

/** Home base keeps its terracotta token via CSS var — it's UI, not signage. */
const BASE_BADGE = `<svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="16" fill="rgb(var(--terracotta-600))" stroke="#fff" stroke-width="2"/><g stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M9.5 17l8.5-7.5 8.5 7.5"/><path d="M11.5 16v10h13V16"/></g></svg>`;

/** Same artwork as components/UsFlag.tsx, as a string for DOM markers. */
const US_FLAG_BADGE = `<span class="poi-usflag" aria-hidden="true"><svg viewBox="2 10 44 27" preserveAspectRatio="none"><path fill="#ECEFF1" d="M1.998 10H45.998V37H1.998z"/><path fill="#F44336" d="M2 10H46V13H2zM2 16H46V19H2zM2 22H46V25H2zM2 28H46V31H2zM2 34H46V37H2z"/><path fill="#3F51B5" d="M2 10H23V25H2z"/></svg></span>`;

const BADGES: Record<PoiCategory, string> = {
  er: ER_BADGE,
  embassy: EMBASSY_BADGE,
  police: POLICE_BADGE,
};

/**
 * A safety-place marker: <button> (keyboard focusable, app focus ring,
 * role button implicit) with the badge + a label that CSS reveals from
 * z13. The caller wires the click handler and maplibregl.Marker.
 */
export function buildPoiMarker(place: MapPlace): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "poi-marker";
  el.dataset.category = place.category;
  el.setAttribute("aria-label", `${place.shortName} — ${ARIA_PHRASE[place.category]}`);
  el.innerHTML =
    `<span class="poi-visual" aria-hidden="true">${BADGES[place.category]}${place.usFlag ? US_FLAG_BADGE : ""}</span>` +
    `<span class="poi-label${place.labelAbove ? " poi-label-above" : ""}" aria-hidden="true">${place.shortName}</span>`;
  return el;
}

/** The saved home-base marker — same anatomy, terracotta circle. */
export function buildBaseMarker(label: string): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "poi-marker";
  el.setAttribute("aria-label", label);
  el.innerHTML = `<span class="poi-visual" aria-hidden="true">${BASE_BADGE}</span>`;
  return el;
}

/** Static mini-marker markup for legend chips (Phase 3) — same artwork. */
export function badgeMarkup(category: PoiCategory): string {
  return BADGES[category];
}
