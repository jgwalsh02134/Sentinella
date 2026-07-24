/**
 * Safety points of interest for the map overlay — derived from the app's
 * existing typed data (embassies.ts, emergency.ts poison centers, and the
 * Tuscany 24h-ER hospitals in regions.ts), with coordinates added so they
 * can render as markers. No new places were gathered; every entry below
 * already appears elsewhere in the app with the same name and number.
 *
 * Coordinates are the published street addresses, good to marker accuracy.
 * All data is bundled — markers work fully offline; only the Directions
 * link needs a connection (labeled in the UI).
 */
export type SafetyPoi = {
  id: string;
  kind: "er" | "embassy";
  name: string;
  /** Short label for the nearest-help readout, e.g. "Careggi ER". */
  shortName: string;
  city: string;
  address: string;
  /** [lng, lat] */
  lngLat: [number, number];
  phone?: string;
  dial?: string;
  /** 24/7 poison-control line answered at this hospital, when one exists. */
  poisonPhone?: string;
  poisonDial?: string;
};

export const safetyPois: SafetyPoi[] = [
  // ——— 24h emergency rooms (pronto soccorso) ———
  {
    id: "er-careggi",
    kind: "er",
    name: "Careggi University Hospital — 24h ER",
    shortName: "Careggi ER",
    city: "Florence",
    address: "Largo G.A. Brambilla 3 (ER entrance on Viale Pieraccini), Florence",
    lngLat: [11.2465, 43.8046],
    phone: "055 794111",
    dial: "+39055794111",
    poisonPhone: "+39 055 794 7819",
    poisonDial: "+390557947819",
  },
  {
    id: "er-santa-maria-nuova",
    kind: "er",
    name: "Santa Maria Nuova — 24h ER",
    shortName: "Santa Maria Nuova ER",
    city: "Florence",
    address: "Piazza Santa Maria Nuova 1, Florence (historic center)",
    lngLat: [11.2603, 43.7728],
  },
  {
    id: "er-le-scotte",
    kind: "er",
    name: "Le Scotte — 24h ER",
    shortName: "Le Scotte ER",
    city: "Siena",
    address: "Viale Bracci 16, Siena",
    lngLat: [11.3096, 43.3403],
    phone: "0577 585111",
    dial: "+390577585111",
  },
  {
    id: "er-gemelli",
    kind: "er",
    name: "Policlinico Gemelli — 24h ER",
    shortName: "Gemelli ER",
    city: "Rome",
    address: "Largo Agostino Gemelli 8, Rome",
    lngLat: [12.4278, 41.9325],
    phone: "+39 06 305 4343",
    dial: "+39063054343",
    poisonPhone: "+39 06 305 4343",
    poisonDial: "+39063054343",
  },
  {
    id: "er-niguarda",
    kind: "er",
    name: "Ospedale Niguarda — 24h ER",
    shortName: "Niguarda ER",
    city: "Milan",
    address: "Piazza Ospedale Maggiore 3, Milan",
    lngLat: [9.1897, 45.5107],
    phone: "+39 02 6610 1029",
    dial: "+390266101029",
    poisonPhone: "+39 02 6610 1029",
    poisonDial: "+390266101029",
  },

  // ——— Embassies & consulates ———
  {
    id: "embassy-us-florence",
    kind: "embassy",
    name: "U.S. Consulate General Florence",
    shortName: "US Consulate Florence",
    city: "Florence",
    address: "Lungarno Amerigo Vespucci 38, Florence",
    lngLat: [11.2413, 43.7735],
    phone: "+39 055 266 951",
    dial: "+39055266951",
  },
  {
    id: "embassy-us-rome",
    kind: "embassy",
    name: "U.S. Embassy Rome",
    shortName: "US Embassy",
    city: "Rome",
    address: "Via Vittorio Veneto 121, Rome",
    lngLat: [12.4893, 41.9075],
    phone: "+39 06 46741",
    dial: "+390646741",
  },
  {
    id: "embassy-uk-rome",
    kind: "embassy",
    name: "British Embassy Rome",
    shortName: "UK Embassy",
    city: "Rome",
    address: "Via XX Settembre 80a, Rome",
    lngLat: [12.5029, 41.907],
    phone: "+39 06 4220 0001",
    dial: "+390642200001",
  },
  {
    id: "embassy-canada-rome",
    kind: "embassy",
    name: "Embassy of Canada to Italy",
    shortName: "Canadian Embassy",
    city: "Rome",
    address: "Via Zara 30, Rome",
    lngLat: [12.5087, 41.9187],
    phone: "+39 06 854441",
    dial: "+3906854441",
  },
  {
    id: "embassy-australia-rome",
    kind: "embassy",
    name: "Australian Embassy Rome",
    shortName: "Australian Embassy",
    city: "Rome",
    address: "Via Antonio Bosio 5, Rome",
    lngLat: [12.5136, 41.9165],
    phone: "+39 06 852721",
    dial: "+3906852721",
  },
  {
    id: "embassy-ireland-rome",
    kind: "embassy",
    name: "Embassy of Ireland",
    shortName: "Irish Embassy",
    city: "Rome",
    address: "Villa Spada, Via Giacomo Medici 1, Rome",
    lngLat: [12.4645, 41.8863],
    phone: "+39 06 585 2381",
    dial: "+39065852381",
  },
  {
    id: "embassy-nz-rome",
    kind: "embassy",
    name: "New Zealand Embassy Rome",
    shortName: "NZ Embassy",
    city: "Rome",
    address: "Via Clitunno 44, Rome",
    lngLat: [12.5033, 41.9202],
    phone: "+39 06 853 7501",
    dial: "+39068537501",
  },
];
