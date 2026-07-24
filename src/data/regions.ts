export type BriefItem = {
  /** ≤90 chars, always visible. */
  lead: string;
  /** Depth behind a Disclosure. */
  detail?: string;
};

export type RegionBrief = {
  name: string;
  headline: string;
  watch: BriefItem[];
  move: BriefItem[];
  /** Extra labeled sections beyond the standard watch/move pair. */
  sections?: { label: string; bullets: BriefItem[] }[];
  /** Official or directions links, rendered as PLAIN links (need a connection). */
  links?: { label: string; url: string }[];
  /** Verify-before-travel caveat, required whenever bullets carry contact data. */
  caveat?: string;
  /** Collapsed under "More cities" — not on this trip's route. */
  secondary?: boolean;
};

/** Trip order: Rome, Florence, Tuscany full; the rest collapse. */
export const regions: RegionBrief[] = [
  {
    name: "Rome",
    headline: "Very safe for violent crime; world-class for pickpockets.",
    watch: [
      {
        lead: "Metro Line A and buses 64 and 40 are the classic lift zones.",
        detail: "Worst between Termini and Ottaviano. Phone away before the doors open.",
      },
      { lead: "Termini station: bags closed and in front, platform to street." },
      { lead: "Costumed 'gladiators' and bracelet sellers work the Colosseum and Trevi." },
    ],
    move: [
      {
        lead: "Taxis: official white cars from marked ranks or a licensed app.",
        detail: "Airport runs have fixed tariffs posted on the car — confirm before departure.",
      },
      {
        lead: "The centro storico is walkable and busy late.",
        detail: "Stick to lit main streets after midnight around Termini and Esquilino.",
      },
      {
        lead: "Driving into the center means ZTL cameras and near-certain fines.",
        detail: "Park outside and use transit.",
      },
    ],
  },
  {
    name: "Florence",
    headline: "Compact, calm, crowded.",
    watch: [
      { lead: "Pickpockets work the Duomo, San Lorenzo stalls, and packed Uffizi queues." },
      { lead: "Bag hooks under restaurant tables — loop the strap on your knee." },
    ],
    move: [
      {
        lead: "The ZTL covers nearly the whole center, camera-enforced.",
        detail: "Rental cars stay in garages on the ring.",
      },
      { lead: "Everything central is walkable; the station area is fine but scruffy late." },
    ],
  },
  {
    name: "Tuscany",
    headline: "Hill towns and ZTL cameras — the region rewards planning.",
    watch: [
      {
        lead: "ZTL cameras gate Florence, Siena, Lucca, and Pisa — every pass is a separate fine.",
        detail:
          "Roughly €80–335 per camera pass, plus a ~€60 rental-agency admin fee, arriving by mail weeks later.",
      },
      {
        lead: "Florence's central ZTL runs about Mon–Fri 07:30–20:00 and Saturday to 16:00.",
        detail:
          "Park outside the walls. If your hotel is inside the zone, have them register your plate BEFORE you drive in.",
      },
      {
        lead: "International Driving Permit: required with a US license, checked at stops.",
        detail: "Get one from AAA (~$20) before leaving the US. On-the-spot fines are real.",
      },
    ],
    move: [
      {
        lead: "Hill towns mean cobblestones, stairs, steep grades, and few elevators.",
        detail:
          "San Gimignano, Siena, Cortona, Montepulciano. October rain makes the stone slick — wear sturdy grippy shoes, plan rest stops, and confirm your lodging has an elevator if stairs are an issue.",
      },
    ],
    sections: [
      {
        label: "24h emergency rooms (pronto soccorso)",
        bullets: [
          {
            lead: "Careggi (Florence): Largo G.A. Brambilla 3 — switchboard 055 794111.",
            detail: "The ER entrance is on Viale Pieraccini.",
          },
          { lead: "Santa Maria Nuova (Florence): Piazza Santa Maria Nuova 1 — historic center." },
          { lead: "Le Scotte (Siena): Viale Bracci — switchboard 0577 585111." },
        ],
      },
      {
        label: "October medical reality",
        bullets: [
          { lead: "Tourist clinics: the summer-only guardia medica turistica is closed by October." },
          {
            lead: "After-hours, non-emergency care: call 116117 (Continuità Assistenziale, year-round).",
            detail: "Non-residents pay roughly €20 at the clinic or €30–35 for a home visit.",
          },
          {
            lead: "Pharmacies: after-hours coverage rotates — check the farmacia di turno sign on any door.",
          },
          { lead: "Emergencies: always 112." },
        ],
      },
      {
        label: "October on the ground",
        bullets: [
          {
            lead: "White truffles: menus appear in October.",
            detail: "The San Miniato fair itself runs the last three weekends of November.",
          },
          {
            lead: "Olive harvest: late October through November — book agriturismi ahead.",
          },
          {
            lead: "Winter hours start Oct 25 — check hours for your exact dates.",
            detail:
              "The Colosseum's last entry drops from 17:30 to 15:30; the Uffizi is closed Mondays year-round.",
          },
        ],
      },
    ],
    links: [
      {
        label: "Directions — Careggi ER",
        url: "https://maps.apple.com/?daddr=Largo%20G.A.%20Brambilla%203%2C%20Florence%2C%20Italy",
      },
      {
        label: "Directions — Santa Maria Nuova",
        url: "https://maps.apple.com/?daddr=Piazza%20Santa%20Maria%20Nuova%201%2C%20Florence%2C%20Italy",
      },
      {
        label: "Directions — Le Scotte, Siena",
        url: "https://maps.apple.com/?daddr=Viale%20Bracci%2C%20Siena%2C%20Italy",
      },
      { label: "Allerta meteo — Regione Toscana", url: "https://www.regione.toscana.it/allertameteo" },
      { label: "LaMMA weather service", url: "https://www.lamma.toscana.it" },
    ],
    caveat:
      "Numbers, hours, and prices verified July 2026 — verify against official sources before relying on them. Tuscany's daily color-coded weather alerts are explained on the seasonal weather card under Basics.",
  },
  {
    name: "Venice",
    headline: "Almost no street crime; your wallet is at risk in other ways.",
    secondary: true,
    watch: [
      { lead: "Crowd-crush points — Rialto, San Marco, narrow calli — are where pockets get picked." },
      { lead: "Vaporetti at rush load like the metro: bags in front." },
      {
        lead: "Unpriced menus and 'per 100g' seafood cluster near San Marco.",
        detail: "Agree gondola prices before boarding — official tariffs exist.",
      },
    ],
    move: [
      {
        lead: "Acqua alta (tidal flooding) peaks roughly October–January.",
        detail: "The city posts sirens and raised walkways — waterproof shoes beat cancelled plans.",
      },
      {
        lead: "At night the city empties fast; safe, but carry an offline map.",
        detail: "The alleys defeat everyone.",
      },
    ],
  },
  {
    name: "Milan",
    headline: "Business-city safe, with station and nightlife caveats.",
    secondary: true,
    watch: [
      { lead: "Milano Centrale: 'helpers' at ticket machines — decline all assistance." },
      { lead: "Piazza del Duomo: bracelet, corn-for-pigeons, and petition crews." },
      { lead: "Navigli and Corso Como late at night: phone snatching from café tables." },
    ],
    move: [
      { lead: "Metro is safe and efficient; keep phones off the door line at stops." },
      { lead: "Use taxi ranks or apps after midnight rather than hailing." },
    ],
  },
  {
    name: "Naples",
    headline: "Warm, intense, and manageable with city instincts.",
    secondary: true,
    watch: [
      { lead: "Scooter bag-snatching: bags on the building side, phones away at curbs." },
      {
        lead: "The Circumvesuviana to Pompeii and Sorrento is a known pickpocket run.",
        detail: "Nothing in back pockets.",
      },
      { lead: "Around Garibaldi station, the Quartieri Spagnoli, and Sanità, stay alert late." },
    ],
    move: [
      { lead: "Never leave anything visible in a parked car — rental plates doubly so." },
      {
        lead: "Agree taxi prices or insist on the meter.",
        detail: "Licensed drivers carry a posted tariff card.",
      },
    ],
  },
  {
    name: "South & islands (driving)",
    headline: "The risk is the road, not the people.",
    secondary: true,
    watch: [
      { lead: "Amalfi, Sicilian, and Sardinian coast roads: narrow lanes, buses on blind corners." },
      { lead: "Beach and trailhead parking is smash-and-grab territory — empty cabin, always." },
    ],
    move: [
      { lead: "Drive defensively; tap the horn on blind hairpins like the locals do." },
      { lead: "In August, book ferries and lodging ahead — heat plus improvisation is the hazard." },
    ],
  },
];
