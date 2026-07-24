/**
 * Rome 24h emergency rooms (pronto soccorso) for the Emergency screen.
 *
 * Switchboard numbers verified against each hospital's OWN site (or a
 * government registry) in July 2026 — never guessed:
 *   Gemelli 06 30151 (policlinicogemelli.it) · Umberto I 06 49971
 *   (policlinicoumberto1.it, 24h) · San Camillo-Forlanini 06 58701
 *   (scuolainospedale.mim.gov.it registry) · Isola Tiberina 06 68371
 *   (ospedaleisolatiberina.it) · Bambino Gesù 06 6859 1
 *   (ospedalebambinogesu.it) · Rome American Hospital 06 22551 (rah.it).
 *
 * Tuscany ERs are NOT here — they live in safetyPois.ts (one source of
 * truth) and the Emergency screen surfaces them from there.
 */
export type EmergencyRoom = {
  name: string;
  address: string;
  phone?: string;
  dial?: string;
  /** The one fact that changes who should go, e.g. "Children's hospital". */
  note?: string;
};

export const romeEmergencyRooms: EmergencyRoom[] = [
  {
    name: "Policlinico Gemelli",
    address: "Largo Agostino Gemelli 8, Rome",
    phone: "+39 06 30151",
    dial: "+390630151",
  },
  {
    name: "Policlinico Umberto I",
    address: "Viale del Policlinico 155, Rome",
    phone: "+39 06 49971",
    dial: "+390649971",
  },
  {
    name: "San Camillo-Forlanini",
    address: "Circonvallazione Gianicolense 87, Rome",
    phone: "+39 06 58701",
    dial: "+390658701",
  },
  {
    name: "Fatebenefratelli (Isola Tiberina)",
    address: "Via di Ponte Quattro Capi 39, Rome",
    phone: "+39 06 68371",
    dial: "+390668371",
    note: "Central Rome — now named Ospedale Isola Tiberina, Gemelli Isola.",
  },
  {
    name: "Bambino Gesù",
    address: "Piazza Sant'Onofrio 4, Rome",
    phone: "+39 06 68591",
    dial: "+390668591",
    note: "Children's hospital.",
  },
  {
    name: "Rome American Hospital",
    address: "Via Emilio Longoni 69, Rome",
    phone: "+39 06 22551",
    dial: "+390622551",
    note: "Private — English-speaking, payment up front.",
  },
];

export const erCostNote =
  "Public ERs treat true emergencies at little or no cost; follow-up care isn't free.";

export const embassyDoctorsLink = {
  label: "Embassy list of English-speaking doctors",
  url: "https://it.usembassy.gov/medical-assistance/",
  note: "Needs a connection.",
} as const;
