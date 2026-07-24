export type InfoItem = {
  title: string;
  /** ≤90 chars, bold, always visible — the load-bearing line. */
  summary: string;
  /** Depth behind the Disclosure. */
  detail?: string;
  /** Unnumbered depth points, rendered inside the Disclosure. */
  bullets?: string[];
  /** Numbered ONLY because the sequence is real (earthquake drill). */
  steps?: string[];
  /** Must-not-miss warning, always visible as a Callout (max one per item). */
  warning?: string;
  /**
   * Official external resources only — every URL here must be verified as
   * the official source (government body, operator, or store listing by the
   * official publisher). Rendered as PLAIN links inside the Disclosure;
   * they need a connection, unlike the guide itself.
   */
  links?: { label: string; url: string }[];
};

export const healthItems: InfoItem[] = [
  {
    title: "Emergency room = Pronto Soccorso",
    summary: "Open 24/7 at every sizeable hospital; no one is turned away.",
    detail:
      "Triage assigns priority — life-threatening cases first — so minor issues can mean long waits. For a true emergency, call 118 rather than self-driving.",
  },
  {
    title: "Pharmacies do more than sell",
    summary: "The green cross handles minor ailments and points you to a doctor.",
    detail:
      "Outside opening hours, a sign on every pharmacy door lists the farmacia di turno — the nearest one on duty that night.",
  },
  {
    title: "Out-of-hours doctor",
    summary: "Doctor-but-not-ambulance problems: guardia medica, 116 117 in many regions.",
    detail:
      "The guardia medica (continuità assistenziale) covers nights and weekends. Where 116 117 doesn't answer, your hotel or any pharmacy will know the local number.",
  },
  {
    title: "EU & UK visitors: bring the card",
    summary: "The EHIC (EU) or GHIC (UK) gives state healthcare on residents' terms.",
    warning:
      "The card is not a substitute for travel insurance — repatriation and private clinics are not covered.",
    links: [
      {
        label: "Apply for a UK GHIC (NHS)",
        url: "https://www.nhs.uk/using-the-nhs/healthcare-abroad/apply-for-a-free-uk-global-health-insurance-card-ghic/",
      },
    ],
  },
  {
    title: "Everyone else: insurance first",
    summary: "Emergency care stabilizes anyone, but bills follow for non-residents.",
    detail:
      "Carry your insurer's 24/7 assistance number and policy ID somewhere outside your phone.",
  },
  {
    title: "Prescriptions",
    summary: "Original packaging plus a prescription copy with the generic name.",
    detail:
      "Brand names differ in Italy. With the molecule name, pharmacies can often dispense equivalents on a local doctor's script.",
  },
  {
    title: "Traveling at 60+",
    summary: "The in-country senior checklist — the pre-trip half lives in Before you fly.",
    bullets: [
      "Carry insurance details and fill in your phone's Medical ID — both readable when you can't speak for yourself.",
      "Medications: original packaging, prescriptions handy.",
      "Pharmacies (farmacia, the green cross): minor issues handled on the spot; many pharmacists speak English.",
      "116117: after-hours, non-urgent care. 112: emergencies, always.",
      "Pace yourself: cobblestones and stairs demand attention, doubly so in rain — plan rest stops.",
      "Discounts: Italy's over-65 museum rates apply to EU/EEA citizens only — US visitors pay full price (Colosseum €18 + €2 booking fee; the Vatican has no senior rate).",
    ],
    warning:
      "Trenitalia's Carta d'Argento senior railcard was discontinued for new purchase on April 1, 2026 — don't buy one from a reseller.",
    links: [{ label: "Before you fly — pre-trip checklist", url: "/prepare" }],
  },
  {
    title: "Water, heat, and insects",
    summary: "Tap water is safe unless marked 'acqua non potabile'; heat is the real hazard.",
    detail:
      "Public fountains (nasoni in Rome) are drinkable. Summer heat is the most common health incident — hydrate and plan shade at midday. Mosquitoes are a northern summer nuisance; repellent handles it.",
  },
];

export const basicsItems: InfoItem[] = [
  // The "112 Where ARE U" companion app renders right after this item via
  // the shared WhereAreUCard — one source of truth with the Emergency screen.
  {
    title: "112 works everywhere",
    summary: "One number for everything, from any phone, free, with interpreters.",
  },
  {
    title: "Your iPhone's built-in safety net",
    summary: "Set up Emergency SOS, Medical ID, and Check In before you fly.",
    detail: "These complement this app and 112 — they don't replace them.",
    bullets: [
      "Emergency SOS via satellite: works in Italy on iPhone 14 and later with no cell or Wi-Fi. You need open sky — exactly the situation in rural Tuscany.",
      "Messages and Find My also work via satellite — text a contact and stay findable off-grid.",
      "Medical ID: conditions, medications, and contacts, readable from the lock screen without your passcode.",
      "Check In (in Messages): a contact is alerted automatically if you don't arrive.",
    ],
    links: [
      // Official Apple support page (HT213426 redirects here).
      { label: "Apple — Emergency SOS via satellite", url: "https://support.apple.com/en-us/101573" },
    ],
  },
  {
    title: "IT-alert: the loud message is official",
    summary: "Italy's cell-broadcast alarm reaches any phone on an Italian network — read it.",
    detail:
      "US phones roaming or on a travel eSIM included. No app, no registration, nothing to set up. A loud IT-alert is the government warning everyone in the area about a major emergency.",
    links: [{ label: "it-alert.gov.it (official)", url: "https://www.it-alert.gov.it" }],
  },
  {
    title: "Strikes are scheduled, not surprises",
    summary: "Strikes (scioperi) are announced days ahead — check the operator's site the night before.",
    detail:
      "They usually run set hours with guaranteed peak service. Check Trenitalia, Italo, or your airline, and have a fallback.",
    links: [
      { label: "Trenitalia — strike info", url: "https://www.trenitalia.com/en/information/in-case-of-strike.html" },
    ],
  },
  {
    title: "ZTL zones will fine you by camera",
    summary: "Hotel inside a ZTL? It must register your plate — call ahead.",
    detail:
      "Historic centers are Zona a Traffico Limitato: restricted to permits, enforced by cameras, fines mailed to your rental company months later.",
  },
  {
    title: "Validate regional train tickets",
    summary: "Stamp paper regional tickets on the platform or risk an on-the-spot fine.",
    detail: "App tickets and high-speed reservations don't need it.",
  },
  {
    title: "Earthquakes happen",
    summary: "Italy is seismically active — note your building's exit route on arrival.",
    steps: [
      "Drop.",
      "Take cover under something solid, away from glass.",
      "Hold on until the shaking stops — expect aftershocks.",
    ],
  },
  {
    title: "Beach flags mean what they say",
    summary: "Staffed lidos (stabilimenti) have lifeguards; free beaches (spiagge libere) often don't.",
    warning: "Red flag = no swimming, and currents on some coasts are serious.",
  },
  {
    title: "Register your trip",
    summary: "Enroll in your government's traveler program (U.S.: STEP) before departure.",
    detail: "It pushes alerts and helps your embassy find you in a crisis.",
    links: [{ label: "Enroll in STEP (US)", url: "https://step.state.gov" }],
  },
  {
    title: "Keep a paper layer",
    summary: "One printed sheet: passport copy, insurance, key numbers, addresses.",
    detail:
      "Carried separately from your phone, it turns a lost or dead phone from a crisis into an errand.",
  },
];
