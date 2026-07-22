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
      "The single European emergency number. Works nationwide from any phone, free, even without a SIM or signal from your own carrier. Operators can route you to police, medical, or fire, and interpreters are available in major languages.",
    tier: "primary",
  },
  {
    number: "113",
    dial: "113",
    name: "State Police",
    nameIt: "Polizia di Stato",
    detail: "Direct line to the state police for crimes in progress, theft, and public safety issues.",
    tier: "service",
  },
  {
    number: "115",
    dial: "115",
    name: "Fire Brigade",
    nameIt: "Vigili del Fuoco",
    detail: "Fires, gas leaks, structural collapses, people trapped, and technical rescue.",
    tier: "service",
  },
  {
    number: "118",
    dial: "118",
    name: "Medical emergency",
    nameIt: "Emergenza Sanitaria",
    detail: "Ambulance and urgent medical response. Say the town you are in first — regions run separate dispatch centers.",
    tier: "service",
  },
  {
    number: "1530",
    dial: "1530",
    name: "Coast Guard",
    nameIt: "Guardia Costiera",
    detail: "Emergencies at sea and on the coast: swimmers or boats in difficulty.",
    tier: "service",
  },
  {
    number: "1522",
    dial: "1522",
    name: "Anti-violence & stalking",
    nameIt: "Antiviolenza e Stalking",
    detail: "Free, 24/7, multilingual national helpline for violence and stalking. Discreet — also reachable via app and chat.",
    tier: "support",
  },
  {
    number: "116 117",
    dial: "116117",
    name: "Non-urgent medical care",
    nameIt: "Guardia Medica",
    detail: "Out-of-hours doctor for problems that are not life-threatening. Active in many regions; where it is not, ask your accommodation for the local guardia medica number.",
    tier: "support",
  },
  {
    number: "803 116",
    dial: "803116",
    name: "Roadside assistance (ACI)",
    nameIt: "Soccorso Stradale",
    detail: "Automobile Club d'Italia breakdown service, 24/7. Paid unless you are a member or your rental includes cover — confirm the price before the truck is dispatched.",
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
export const poisonCenters: PoisonCenter[] = [
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

/** What to say when you call 112 — shown next to the primary plate. */
export const callScript = [
  "Where you are: town, street, and a landmark. Location first — the call can drop.",
  "What happened: accident, crime, fire, medical.",
  "Who is involved: how many people, ages, conditions.",
  "Your number, in case the operator needs to call back.",
  "Stay on the line until the operator tells you to hang up.",
];
