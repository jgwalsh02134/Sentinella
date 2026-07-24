export type RegionBrief = {
  name: string;
  headline: string;
  watch: string[];
  move: string[];
  /** Extra labeled bullet sections beyond the standard watch/move pair. */
  sections?: { label: string; bullets: string[] }[];
  /** Official or directions links, rendered as outline buttons (need a connection). */
  links?: { label: string; url: string }[];
  /** Verify-before-travel caveat, required whenever bullets carry contact data. */
  caveat?: string;
};

export const regions: RegionBrief[] = [
  {
    name: "Rome",
    headline: "Very safe for violent crime; world-class for pickpockets.",
    watch: [
      "Metro Line A between Termini and Ottaviano, and buses 64 and 40, are the classic lift zones.",
      "Termini station: keep bags closed and in front from the platform to the street.",
      "Costumed 'gladiators' and bracelet sellers around the Colosseum and Trevi.",
    ],
    move: [
      "Taxis: official white cars from marked ranks or a licensed app; airport runs have fixed tariffs posted on the car — confirm before departure.",
      "The centro storico is walkable and busy late; stick to lit main streets after midnight around Termini and Esquilino.",
      "Driving into the center means ZTL camera zones and near-certain fines — park outside and use transit.",
    ],
  },
  {
    name: "Milan",
    headline: "Business-city safe, with station and nightlife caveats.",
    watch: [
      "Milano Centrale: 'helpers' at ticket machines and bag watchers — decline all assistance.",
      "Piazza del Duomo: bracelet, corn-for-pigeons, and petition crews.",
      "Navigli and Corso Como late at night: phone snatching from café tables.",
    ],
    move: [
      "Metro is safe and efficient; keep phones off the door line at stops.",
      "Use taxi ranks or apps after midnight rather than hailing.",
    ],
  },
  {
    name: "Naples",
    headline: "Warm, intense, and manageable with city instincts.",
    watch: [
      "Scooter bag-snatching: bags on the building side, phones out of sight at curbs.",
      "The Circumvesuviana line to Pompeii and Sorrento is a known pickpocket run — nothing in back pockets.",
      "Around Garibaldi station and the tighter alleys of the Quartieri Spagnoli and Sanità, stay alert late at night.",
    ],
    move: [
      "Never leave anything visible in a parked car, rental plates doubly so.",
      "Agree taxi prices or insist on the meter; licensed drivers carry a posted tariff card.",
    ],
  },
  {
    name: "Florence",
    headline: "Compact, calm, crowded.",
    watch: [
      "Pickpockets around the Duomo, San Lorenzo market stalls, and packed Uffizi queues.",
      "Bag hooks under restaurant tables — keep straps looped on your knee.",
    ],
    move: [
      "The ZTL covers nearly the whole center and is camera-enforced; rental cars should stay in garages on the ring.",
      "Everything central is walkable; the station area is fine but scruffy late.",
    ],
  },
  {
    name: "Tuscany",
    headline: "Hill towns and ZTL cameras — the region rewards planning.",
    watch: [
      "ZTL cameras: Florence, Siena, Lucca, and Pisa all gate their centers with camera-enforced ZTL zones. Every camera pass is a separate fine — roughly €80–335 each, plus a ~€60 rental-agency admin fee, arriving by mail weeks later.",
      "Florence's central ZTL: runs about Mon–Fri 07:30–20:00 and Saturday to 16:00. Park outside the walls; if your hotel is inside the zone, have them register your plate BEFORE you drive in.",
      "International Driving Permit: legally required alongside a US license and checked at police stops — get one from AAA (~$20) before leaving the US. On-the-spot fines are real.",
    ],
    move: [
      "Hill towns (San Gimignano, Siena, Cortona, Montepulciano): cobblestones, stairs, steep grades, and few elevators. October rain makes the stone slick — wear sturdy grippy shoes, plan rest stops, and confirm your lodging has an elevator if stairs are an issue.",
    ],
    sections: [
      {
        label: "24h emergency rooms (pronto soccorso)",
        bullets: [
          "Careggi (Florence): Largo G.A. Brambilla 3 — switchboard 055 794111; the ER entrance is on Viale Pieraccini.",
          "Santa Maria Nuova (Florence): Piazza Santa Maria Nuova 1 — in the historic center.",
          "Le Scotte (Siena): Viale Bracci — switchboard 0577 585111.",
        ],
      },
      {
        label: "October medical reality",
        bullets: [
          "Tourist clinics: the summer-only guardia medica turistica is closed by October.",
          "After-hours, non-emergency care: call 116117 (Continuità Assistenziale, year-round); non-residents pay roughly €20 at the clinic or €30–35 for a home visit.",
          "Pharmacies: after-hours coverage rotates — look for the farmacia di turno sign posted on any pharmacy door.",
          "Emergencies: always 112.",
        ],
      },
      {
        label: "October on the ground",
        bullets: [
          "White truffles: menus appear in October; the San Miniato fair itself runs the last three weekends of November.",
          "Olive harvest: late October through November — agriturismi and small towns get busy, book ahead.",
          "Winter hours from Oct 25: sites shift schedules (the Colosseum's last entry drops from 17:30 to 15:30; the Uffizi is closed Mondays year-round) — check hours for your exact dates.",
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
    watch: [
      "Crowd-crush points — Rialto bridge, San Marco, narrow calli — are where pockets get picked.",
      "Vaporetti at rush load like the metro: bags in front.",
      "Unpriced menus and 'per 100g' seafood near San Marco; agree gondola prices (official tariffs exist) before boarding.",
    ],
    move: [
      "Acqua alta (tidal flooding) peaks roughly October–January; the city posts sirens and raised walkways — waterproof shoes beat cancelled plans.",
      "At night the city empties fast; it is safe, but download an offline map — the alleys defeat everyone.",
    ],
  },
  {
    name: "South & islands (driving)",
    headline: "The risk is the road, not the people.",
    watch: [
      "Amalfi, Sicilian, and Sardinian coast roads: narrow lanes, buses on blind corners, scooters passing everywhere.",
      "Beach and trailhead parking is smash-and-grab territory — empty cabin, always.",
    ],
    move: [
      "Drive defensively and use horn taps on blind hairpins like the locals do.",
      "In August, book ferries and lodging ahead; heat plus improvisation is the real hazard.",
    ],
  },
];
