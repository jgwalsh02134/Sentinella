/**
 * Law-enforcement locations a traveler actually needs — where to file a
 * denuncia (police report), which insurance claims and passport
 * replacement both require. Typed static data, bundled for offline like
 * everything in src/data.
 *
 * EMERGENCY FRAMING (repeat in every UI that shows these): a crime in
 * progress means CALL 112 — never travel to a station. Stations are for
 * the paperwork afterward.
 *
 * Verification (2026-07-24, during development):
 *  - Every Questura entry + the Termini rail-police post: verified against
 *    the official questure.poliziadistato.it pages (address, phone, and
 *    for Florence/Siena the Ufficio Denunce detail).
 *  - Carabinieri stations: carabinieri.it's "Dove siamo" locator is a
 *    JS application that can't be cited by URL; these three entries are
 *    corroborated by multiple independent directories (PagineBianche
 *    verified-phone listings, reteimprese) whose coordinates agree with
 *    independent geocoding of the street address. Anything that couldn't
 *    be corroborated was dropped, not guessed.
 *  - All coordinates cross-checked against OSM/Nominatim geocoding of the
 *    published street address; marker accuracy.
 */

export type PoliceStation = {
  id: string;
  type: "questura" | "polizia" | "carabinieri";
  name: string;
  /** Short label for map text labels, e.g. "Questura". */
  shortName: string;
  city: string;
  address: string;
  /** [lng, lat] */
  lngLat: [number, number];
  phone?: string;
  dial?: string;
  /** Traveler context — hours quirks, what this post is good for. */
  notes?: string;
};

/** One line shown with every station list and place card. */
export const denunciaNote =
  "File a denuncia (police report) at any Polizia or Carabinieri station — required for insurance and passport replacement.";

/** The emergency framing that must accompany station listings. */
export const stationEmergencyNote =
  "Crime in progress? Call 112 — don't travel to a station.";

export const policeStations: PoliceStation[] = [
  // ——— Rome ———
  {
    id: "questura-roma",
    type: "questura",
    name: "Questura di Roma",
    shortName: "Questura di Roma",
    city: "Rome",
    address: "Via di San Vitale 15, 00184 Rome",
    lngLat: [12.4917, 41.9005],
    phone: "+39 06 46861",
    dial: "+390646861",
    notes: "Police headquarters for Rome; Ufficio Denunce on site.",
  },
  {
    id: "polizia-termini",
    type: "polizia",
    name: "Polizia Ferroviaria — Roma Termini",
    shortName: "Polizia Termini",
    city: "Rome",
    address: "Stazione Termini, by platform 1 (Piazza dei Cinquecento), Rome",
    lngLat: [12.5017, 41.9006],
    notes:
      "Rail-police front office inside the station — takes travelers' theft reports without leaving Termini.",
  },
  {
    id: "carabinieri-farnese",
    type: "carabinieri",
    name: "Carabinieri — Stazione Roma Piazza Farnese",
    shortName: "Carabinieri Farnese",
    city: "Rome",
    address: "Piazza della Trinità dei Pellegrini 34, 00186 Rome",
    lngLat: [12.4728, 41.8937],
    phone: "+39 06 686 5115",
    dial: "+39066865115",
    notes: "Historic-center station, a few blocks from Campo de' Fiori.",
  },
  {
    id: "carabinieri-san-pietro",
    type: "carabinieri",
    name: "Carabinieri — Stazione Roma San Pietro",
    shortName: "Carabinieri San Pietro",
    city: "Rome",
    address: "Via del Crocifisso 46, 00165 Rome",
    lngLat: [12.4519, 41.8997],
    phone: "+39 06 3936 7731",
    dial: "+390639367731",
    notes: "Closest station to St. Peter's / the Vatican area.",
  },

  // ——— Florence ———
  {
    id: "questura-firenze",
    type: "questura",
    name: "Questura di Firenze",
    shortName: "Questura di Firenze",
    city: "Florence",
    address: "Via Zara 2, 50129 Florence",
    lngLat: [11.259, 43.7818],
    phone: "+39 055 49771",
    dial: "+3905549771",
    notes: "Ufficio Denunce on the ground floor of Via Zara 2.",
  },
  {
    id: "carabinieri-firenze",
    type: "carabinieri",
    name: "Carabinieri — Borgo Ognissanti (Caserma Corsi)",
    shortName: "Carabinieri Ognissanti",
    city: "Florence",
    address: "Borgo Ognissanti 48, 50123 Florence",
    lngLat: [11.2453, 43.7728],
    phone: "+39 055 2061",
    dial: "+390552061",
    notes: "Centro storico, a short walk from the Arno and Santa Maria Novella.",
  },

  // ——— Siena ———
  {
    id: "questura-siena",
    type: "questura",
    name: "Questura di Siena",
    shortName: "Questura di Siena",
    city: "Siena",
    address: "Via del Castoro 6, 53100 Siena",
    lngLat: [11.3299, 43.3173],
    phone: "+39 0577 201111",
    dial: "+390577201111",
    notes:
      "Just south of the Duomo. Urgent reports are taken after 20:00 too — call the switchboard first.",
  },
];
