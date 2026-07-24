/**
 * Seasonal weather-safety cards for the guide — static typed content,
 * bundled for offline like everything else in src/data. Which card shows is
 * decided by the Europe/Rome date in src/lib/season.ts: the heat card
 * during the Ministry of Health heat-bulletin season, the allerta-meteo
 * card the rest of the year. Both ship in the bundle; neither is deleted.
 */

export type WeatherLevel = {
  /** Official Italian code name, e.g. "ARANCIONE". */
  code: string;
  meaning: string;
};

export type WeatherCard = {
  id: "heat" | "allerta";
  title: string;
  intro: string;
  levels?: WeatherLevel[];
  points: string[];
  /** Must-not-miss line, rendered as the amber callout. */
  warning: string;
  links: { label: string; url: string }[];
};

/** Shown with the standard "verify before travel" caveat on linked data. */
export const weatherLastVerified = "July 2026";

/**
 * Ministry of Health heat-bulletin season. 2026: 25 May – 20 September
 * (Ministero della Salute circular 3873/2026). Month/day in Europe/Rome.
 */
export const HEAT_SEASON = {
  start: { month: 5, day: 25 },
  end: { month: 9, day: 20 },
} as const;

export const heatCard: WeatherCard = {
  id: "heat",
  title: "Summer heat: check the daily bollino",
  intro:
    "Through the heat season the Ministry of Health publishes daily heat-health bulletins (bollini) for 27 cities, graded green, yellow, orange, and red. The 2026 season runs 25 May – 20 September (circular 3873/2026).",
  points: [
    "On orange and red days, move sightseeing to early morning and evening, and plan shade or indoor stops at midday.",
    "Hydrate steadily — public fountains are drinkable — and check on the over-75s in your group. Heat is Italy's most common summer health incident.",
  ],
  warning:
    "Bulletins are published each afternoon and cover the next 24–72 hours — check your city's bollino before committing to a full day outdoors.",
  links: [
    {
      label: "Ministero della Salute — daily heat bulletins",
      url: "https://www.salute.gov.it/portale/caldo/homeCaldo.jsp",
    },
  ],
};

export const allertaMeteoCard: WeatherCard = {
  id: "allerta",
  title: "Allerta meteo: read the colors like a local",
  intro:
    "In autumn and winter, regional civil-protection services grade weather risk by color, zone by zone. Bulletins are issued daily — in Tuscany by about 14:00 — and are valid about 36 hours, so check the evening before day trips.",
  levels: [
    { code: "VERDE", meaning: "no criticality — normal conditions." },
    { code: "GIALLO", meaning: "localized hazards possible — stay aware." },
    { code: "ARANCIONE", meaning: "intense events, dangerous to people and property." },
    { code: "ROSSO", meaning: "extreme events, very dangerous — follow official instructions." },
  ],
  points: [
    "Autumn brings flood and flash-flood risk in Tuscany and Lazio — the November 2023 floods in Prato and Campi Bisenzio are the recent reference. On arancione or rosso days, stay clear of underpasses, riverbanks, and basements.",
    "Wet cobblestones: October rain makes cobblestones and hill-town steps genuinely slippery — a real fall risk for older travelers. Wear sturdy shoes with good tread and slow down on grades and stairs.",
  ],
  warning:
    "Alerts are per-zone and per-hazard. If your hotel or host mentions an allerta, take it at face value — locals do.",
  links: [
    { label: "Regione Toscana — allerta meteo", url: "https://www.regione.toscana.it/allertameteo" },
    { label: "LaMMA — Tuscany weather service", url: "https://www.lamma.toscana.it" },
    { label: "Protezione Civile (national)", url: "https://www.protezionecivile.gov.it" },
  ],
};
