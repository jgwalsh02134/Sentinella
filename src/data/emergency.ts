export type EmergencyNumber = {
  number: string;
  /** Digits only, used for tel: links */
  dial: string;
  name: string;
  nameIt: string;
  detail: string;
  /** primary = red plate, service = green plate, support = quiet card */
  tier: "primary" | "service" | "support";
};

/**
 * Core numbers (112, 113, 115, 118) are stable, nationwide and free from any
 * phone. Support-tier numbers are widely published but should be re-verified
 * against official sources before you rely on them operationally — see the
 * disclaimer rendered at the bottom of the Emergency screen.
 */
export const emergencyNumbers: EmergencyNumber[] = [
  {
    number: "112",
    dial: "112",
    name: "All emergencies",
    nameIt: "Numero Unico di Emergenza",
    detail:
      "Free from any phone, no SIM needed. Routes to police, medical, or fire; interpreters available.",
    tier: "primary",
  },
  {
    number: "113",
    dial: "113",
    name: "State Police",
    nameIt: "Polizia di Stato",
    detail: "Crimes in progress, theft, public safety.",
    tier: "service",
  },
  {
    number: "115",
    dial: "115",
    name: "Fire Brigade",
    nameIt: "Vigili del Fuoco",
    detail: "Fires, gas leaks, collapses, people trapped, technical rescue.",
    tier: "service",
  },
  {
    number: "118",
    dial: "118",
    name: "Medical emergency",
    nameIt: "Emergenza Sanitaria",
    detail: "Ambulance. Say your town first — regions run separate dispatch centers.",
    tier: "service",
  },
  {
    number: "1530",
    dial: "1530",
    name: "Coast Guard",
    nameIt: "Guardia Costiera",
    detail: "Emergencies at sea: swimmers or boats in difficulty.",
    tier: "service",
  },
  {
    number: "1522",
    dial: "1522",
    name: "Anti-violence & stalking",
    nameIt: "Antiviolenza e Stalking",
    detail: "Free 24/7 multilingual helpline for violence and stalking; also via app and chat.",
    tier: "support",
  },
  {
    number: "116 117",
    dial: "116117",
    name: "Non-urgent medical care",
    nameIt: "Guardia Medica",
    detail: "Out-of-hours doctor for non-life-threatening problems. Where inactive, ask your accommodation for the local number.",
    tier: "support",
  },
  {
    number: "803 116",
    dial: "803116",
    name: "Roadside assistance (ACI)",
    nameIt: "Soccorso Stradale",
    detail: "ACI breakdown, 24/7. Confirm the price before dispatch — free only for members and covered rentals.",
    tier: "support",
  },
];

export type PoisonCenter = {
  city: string;
  hospital: string;
  phone: string;
  dial: string;
};

/** Major 24/7 poison control centers. Verify before operational use. */
/**
 * Official 112 companion app (developer AREU — Azienda Regionale Emergenza
 * Urgenza). Presented as a supplement on the Emergency screen: dialing 112
 * directly is always the primary action.
 */
export const whereAreUApp = {
  title: "112 Where ARE U — the official app",
  body: "Dials 112 and sends your GPS position to the operator at the same time (official app, developer AREU).",
  bullets: [
    "Active in both Lazio (Rome) and Tuscany (Florence).",
    "Dial 112 directly first — the app is a supplement.",
  ],
  link: {
    label: "App Store — 112 Where ARE U",
    url: "https://apps.apple.com/us/app/112-where-are-u/id888964800",
  },
  note: "Install before you travel — the link needs a connection; calling 112 doesn't.",
} as const;

export const poisonCenters: PoisonCenter[] = [
  // Florence first: this trip is Tuscany-based.
  {
    city: "Florence",
    hospital: "Centro Antiveleni, Ospedale Careggi (24h)",
    phone: "+39 055 794 7819",
    dial: "+390557947819",
  },
  {
    city: "Rome",
    hospital: "Policlinico Gemelli",
    phone: "+39 06 305 4343",
    dial: "+39063054343",
  },
  {
    city: "Milan",
    hospital: "Ospedale Niguarda",
    phone: "+39 02 6610 1029",
    dial: "+390266101029",
  },
];

export type Step = {
  /** Bolded lead — the verb or key fact that must scan instantly. */
  lead: string;
  /** The rest of the instruction, regular weight. */
  rest: string;
};

/** What to say when you call 112 — shown next to the primary plate. */
export const callScript: Step[] = [
  { lead: "Where you are:", rest: "town, street, and a landmark. Location first — the call can drop." },
  { lead: "What happened:", rest: "accident, crime, fire, medical." },
  { lead: "Who is involved:", rest: "how many people, ages, conditions." },
  { lead: "Your number,", rest: "for callbacks." },
  { lead: "Stay on the line", rest: "until the operator tells you to hang up." },
];
