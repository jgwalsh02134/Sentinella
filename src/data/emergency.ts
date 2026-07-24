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
      "Routes to police, medical, or fire; interpreters available.",
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
];

export type LabeledLine = {
  /** Who dials this line, e.g. "From Italian phones". */
  label: string;
  number: string;
  dial: string;
};

/**
 * ACI roadside assistance is TWO numbers: 803 116 answers Italian SIMs
 * only — a traveler on a US phone gets nowhere. ACI runs 800 116 800
 * specifically for foreign-operator mobiles (verified on aci.it network
 * sites, July 2026). Both render together as one roadside item.
 */
export const roadsideAssistance = {
  name: "Roadside assistance (ACI)",
  nameIt: "Soccorso Stradale",
  summary: "Breakdowns, 24/7. Fees may apply — check rental coverage.",
  lines: [
    { label: "From Italian phones", number: "803 116", dial: "803116" },
    { label: "From US or foreign phones", number: "+39 800 116 800", dial: "+39800116800" },
  ] as LabeledLine[],
  /** Some carriers reject the +39 form of Italian toll-free numbers. */
  fallback: { number: "800 116 800", dial: "800116800" },
  footnote: "Orange SOS columns on the autostrada also connect you.",
} as const;

/**
 * State Department Overseas Citizens Services — the 24/7 backstop when
 * no embassy or consulate answers. The US line is framed for family:
 * relatives in New York can act from home. Verified on travel.state.gov,
 * July 2026.
 */
export const overseasCitizensServices = {
  name: "Overseas Citizens Services — State Dept",
  summary: "Can't reach the embassy? State Dept 24/7 line.",
  lines: [
    { label: "From Italy", number: "+1 202 501 4444", dial: "+12025014444" },
    { label: "From the US — for family back home", number: "1 888 407 4747", dial: "+18884074747" },
  ] as LabeledLine[],
} as const;

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
    "Active in Lazio and Tuscany — both regions on this trip.",
    "Dial 112 directly first — the app is a supplement.",
  ],
  links: [
    {
      label: "App Store",
      url: "https://apps.apple.com/us/app/112-where-are-u/id888964800",
    },
    {
      label: "Google Play",
      url: "https://play.google.com/store/apps/details?id=it.Beta80Group.whereareu",
    },
  ],
  note: "Install before you travel — the store links need a connection; calling 112 doesn't.",
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

/**
 * Being robbed in Italy is an Italian-institution process: the stamped
 * police report (denuncia) is the document everything downstream —
 * insurance claims, passport replacement — depends on.
 */
export const robbed = {
  summary: "File a police report (denuncia) — insurance and passport replacement require it.",
  steps: [
    { lead: "Crime in progress:", rest: "call 112." },
    {
      lead: "Then file the denuncia",
      rest: "at any Polizia di Stato Questura or Carabinieri station.",
    },
    {
      lead: "Keep the stamped copy",
      rest: "— insurers and the consulate will ask for it.",
    },
  ] as Step[],
  tip: "English varies; use your hotel or a translation app.",
} as const;
