export type InfoItem = {
  title: string;
  body: string;
  /** Optional bullet list rendered after the body, for multi-part items. */
  bullets?: string[];
  /** Must-not-miss warning, rendered as a highlighted callout (max one per section). */
  warning?: string;
  /**
   * Official external resources only — every URL here must be verified as
   * the official source (government body, operator, or store listing by the
   * official publisher). Rendered as outline link buttons; they need a
   * connection, unlike the guide itself.
   */
  links?: { label: string; url: string }[];
};

export const healthItems: InfoItem[] = [
  {
    title: "Emergency room = Pronto Soccorso",
    body: "Every sizeable hospital (ospedale) has one, open 24/7, and no one is turned away. Triage assigns priority — life-threatening cases first — so minor issues can mean long waits. For a true emergency, call 118 rather than self-driving.",
  },
  {
    title: "Pharmacies do more than sell",
    body: "Look for the green cross. Pharmacists handle minor ailments, advise on medication, and can point you to a doctor. Outside opening hours, a sign on every pharmacy door lists the farmacia di turno — the nearest one on duty that night.",
  },
  {
    title: "Out-of-hours doctor",
    body: "For problems that need a doctor but not an ambulance, the guardia medica (continuità assistenziale) covers nights and weekends. In many regions it answers on 116 117; elsewhere your hotel or any pharmacy will know the local number.",
  },
  {
    title: "EU & UK visitors: bring the card",
    body: "The EHIC (EU) or GHIC (UK) gives access to state healthcare on the same terms as residents.",
    warning: "The card is not a substitute for travel insurance — repatriation and private clinics are not covered.",
    links: [
      {
        label: "Apply for a UK GHIC (NHS)",
        url: "https://www.nhs.uk/using-the-nhs/healthcare-abroad/apply-for-a-free-uk-global-health-insurance-card-ghic/",
      },
    ],
  },
  {
    title: "Everyone else: insurance first",
    body: "Public emergency care will stabilize you regardless, but bills follow for non-residents. Carry your insurer's 24/7 assistance number and policy ID somewhere outside your phone.",
  },
  {
    title: "Prescriptions",
    body: "Bring medication in original packaging with a copy of the prescription, ideally with the generic (molecule) name — brand names differ. Italian pharmacies can often dispense equivalents with a local doctor's script.",
  },
  {
    title: "Traveling at 60+",
    body: "The in-country half of the senior checklist — the pre-trip half (insurance shopping, vaccines, medication rules) lives in Before you fly.",
    bullets: [
      "Carry your insurance details and keep your phone's Medical ID filled in — both readable when you can't speak for yourself.",
      "Medications: original packaging, prescriptions handy.",
      "Pharmacies (farmacia, the green cross): minor issues handled on the spot, and many pharmacists speak English.",
      "116117: after-hours, non-urgent care. 112: emergencies, always.",
      "Pace yourself: cobblestones and stairs demand attention, doubly so in rain — plan rest stops instead of pushing through.",
      "Discount reality: Italy's over-65 museum discounts apply to EU/EEA citizens only — US visitors pay full price (Colosseum €18 + €2 booking fee; the Vatican has no senior rate).",
    ],
    warning:
      "Trenitalia's Carta d'Argento senior railcard was discontinued for new purchase on April 1, 2026 — don't buy one from a reseller.",
    links: [{ label: "Before you fly — pre-trip checklist", url: "/prepare" }],
  },
  {
    title: "Water, heat, and insects",
    body: "Tap water is safe unless marked 'acqua non potabile'; public fountains (nasoni in Rome) are drinkable. Summer heat is the most common health incident — hydrate and plan shade at midday. Mosquitoes are a nuisance in the north in summer; repellent handles it.",
  },
];

export const basicsItems: InfoItem[] = [
  // The "112 Where ARE U" companion app renders right after this item via
  // the shared WhereAreUCard — one source of truth with the Emergency screen.
  {
    title: "112 works everywhere",
    body: "One number for everything, from any phone, free, with interpreters.",
  },
  {
    title: "Your iPhone's built-in safety net",
    body: "Set these up before you fly — they complement this app and 112, they don't replace them.",
    bullets: [
      "Emergency SOS via satellite: works in Italy on iPhone 14 and later when there's no cell or Wi-Fi. You need open sky — exactly the situation in rural Tuscany.",
      "Messages and Find My also work via satellite, so you can text a contact and stay findable off-grid.",
      "Medical ID: fill in conditions, medications, and emergency contacts before flying — responders can read it from the lock screen without your passcode.",
      "Check In (in Messages): tell it where you're headed and a contact is alerted automatically if you don't arrive.",
    ],
    links: [
      // Official Apple support page (HT213426 redirects here).
      { label: "Apple — Emergency SOS via satellite", url: "https://support.apple.com/en-us/101573" },
    ],
  },
  {
    title: "IT-alert: the loud message is official",
    body: "Italy's national cell-broadcast emergency system reaches any powered-on phone connected to an Italian network — including US phones roaming or on a travel eSIM. No app, no registration, nothing to set up.",
    bullets: [
      "If a loud IT-alert lands on your phone, read it: it's the government warning everyone in the affected area about a major emergency.",
    ],
    links: [{ label: "it-alert.gov.it (official)", url: "https://www.it-alert.gov.it" }],
  },
  {
    title: "Strikes are scheduled, not surprises",
    body: "Transport strikes (scioperi) are announced days ahead and usually run set hours with guaranteed peak service. The night before any train or flight, check the operator's site — Trenitalia, Italo, or your airline — and have a fallback.",
    links: [
      { label: "Trenitalia — strike info", url: "https://www.trenitalia.com/en/information/in-case-of-strike.html" },
    ],
  },
  {
    title: "ZTL zones will fine you by camera",
    body: "Historic centers are Zona a Traffico Limitato: restricted to permits, enforced by cameras, with fines mailed to your rental company months later. If your hotel is inside one, it must register your plate — call ahead.",
  },
  {
    title: "Validate regional train tickets",
    body: "Paper regional tickets must be stamped in the small machines on the platform before boarding, or inspectors can fine you on the spot. App tickets and high-speed reservations don't need it.",
  },
  {
    title: "Earthquakes happen",
    body: "Italy is seismically active, especially the Apennine spine. If shaking starts: drop, take cover under something solid away from glass, hold on, and expect aftershocks. Note your building's exit route on arrival — it takes ten seconds.",
  },
  {
    title: "Beach flags mean what they say",
    body: "Staffed lidos (stabilimenti) have lifeguards; free beaches (spiagge libere) often don't.",
    warning: "Red flag = no swimming, and currents on some coasts are serious.",
  },
  {
    title: "Register your trip",
    body: "Many governments run traveler registration (the U.S. STEP program, for example) that pushes alerts and helps your embassy find you in a crisis. Enroll before departure.",
    links: [{ label: "Enroll in STEP (US)", url: "https://step.state.gov" }],
  },
  {
    title: "Keep a paper layer",
    body: "One printed sheet — passport copy, insurance, key phone numbers, accommodation addresses — carried separately from your phone, turns a lost or dead phone from a crisis into an errand.",
  },
];
