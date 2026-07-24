import type { Step } from "@/data/emergency";

export type Embassy = {
  country: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  dial: string;
  email?: string;
  website: string;
  /** ONE line on US posts; overseas 24/7 lines for the others (numbers
      render tappable via TelText). */
  notes?: string;
};

/**
 * Switchboard numbers for embassies and consulates. These are the published
 * main lines; after-hours consular emergency lines differ by country and
 * change more often, so confirm them on the official site before travel.
 * The app renders a "verify before travel" notice wherever this data
 * appears. Verified against travel.state.gov / it.usembassy.gov, July 2026.
 */
export const embassies: Embassy[] = [
  {
    country: "United States",
    name: "U.S. Consulate General Florence",
    city: "Florence",
    address: "Lungarno Amerigo Vespucci 38, 50123 Florence",
    phone: "+39 055 266 951",
    dial: "+39055266951",
    email: "USCitizensFlorence@state.gov",
    website: "https://it.usembassy.gov/embassy-consulates/florence/",
    notes: "Serves Tuscany · same-day emergency passports · same number after hours",
  },
  {
    country: "United States",
    name: "U.S. Embassy Rome",
    city: "Rome",
    address: "Via Vittorio Veneto 121, 00187 Roma",
    phone: "+39 06 46741",
    dial: "+390646741",
    email: "USCitizensRome@state.gov",
    website: "https://it.usembassy.gov",
    notes: "After hours: duty officer for citizen emergencies — covers Florence district too",
  },
  {
    country: "United Kingdom",
    name: "British Embassy Rome",
    city: "Rome",
    address: "Via XX Settembre 80a, 00187 Roma",
    phone: "+39 06 4220 0001",
    dial: "+390642200001",
    website: "https://www.gov.uk/world/italy",
    notes: "Call the FCDO in London (+44 20 7008 5000) for consular emergencies — answers 24/7.",
  },
  {
    country: "Canada",
    name: "Embassy of Canada to Italy",
    city: "Rome",
    address: "Via Zara 30, 00198 Roma",
    phone: "+39 06 854441",
    dial: "+3906854441",
    website: "https://www.canadainternational.gc.ca/italy-italie/",
    notes: "Emergency Watch Centre in Ottawa answers collect calls 24/7: +1 613 996 8885.",
  },
  {
    country: "Australia",
    name: "Australian Embassy Rome",
    city: "Rome",
    address: "Via Antonio Bosio 5, 00161 Roma",
    phone: "+39 06 852721",
    dial: "+3906852721",
    website: "https://italy.embassy.gov.au",
    notes: "24/7 Consular Emergency Centre in Canberra: +61 2 6261 3305.",
  },
  {
    country: "Ireland",
    name: "Embassy of Ireland",
    city: "Rome",
    address: "Villa Spada, Via Giacomo Medici 1, 00153 Roma",
    phone: "+39 06 585 2381",
    dial: "+39065852381",
    website: "https://www.dfa.ie/irish-embassy/italy/",
  },
  {
    country: "New Zealand",
    name: "New Zealand Embassy Rome",
    city: "Rome",
    address: "Via Clitunno 44, 00198 Roma",
    phone: "+39 06 853 7501",
    dial: "+39068537501",
    website: "https://www.mfat.govt.nz",
  },
];

/**
 * What consular officers can and can't do — State Department's own
 * framing, shared by both US posts. ≤6 words per line by design: this
 * is scanned in a crisis.
 */
export const consularHelp = {
  can: [
    "Issue emergency passports",
    "Contact your family",
    "Find doctors and lawyers",
    "Help if you're arrested",
    "Support crime victims",
    "Coordinate after a death",
  ],
  cant: [
    "Pay your bills",
    "Get you out of jail",
    "Act as your lawyer",
    "Provide medical care",
    "Investigate crimes",
  ],
} as const;

export const lostDocumentSteps: Step[] = [
  {
    lead: "Report the loss or theft",
    rest: "at any Carabinieri or Polizia station and get the written report (denuncia). You will need it for the embassy and for insurance.",
  },
  {
    lead: "Contact your embassy or consulate",
    rest: "for an emergency travel document. Bring the denuncia, photos if you have them, and any copy of the lost passport.",
  },
  {
    lead: "Block your cards:",
    rest: "if any were taken, call your bank's international blocking line immediately — keep that number stored outside your wallet.",
  },
  {
    lead: "Keep a paper copy",
    rest: "and an offline photo of your passport, insurance card, and itinerary, separate from the originals.",
  },
];
