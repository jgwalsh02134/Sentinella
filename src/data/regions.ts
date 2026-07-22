export type RegionBrief = {
  name: string;
  headline: string;
  watch: string[];
  move: string[];
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
