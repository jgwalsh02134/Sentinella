export type Scam = {
  title: string;
  /** One-line hook under the name — why this one matters. */
  hook: string;
  /** ≤90 chars, always visible. */
  how: string;
  /** ≤90 chars, bold, always visible — the counter is the payload. */
  counter: string;
  /** Depth behind a Disclosure: where it runs and the fuller mechanics. */
  detail: string;
};

export const scams: Scam[] = [
  {
    title: "Friendship bracelet",
    hook: "The 'gift' tied to your wrist isn't one.",
    how: "A bracelet is tied on 'free', then payment is demanded, loudly.",
    counter: "Never let anyone put anything on you — hands in pockets near big sights.",
    detail:
      "Runs outside the Colosseum, Duomo di Milano, Ponte Vecchio, and the Spanish Steps. An accomplice may work your pockets while you argue — walk on without stopping.",
  },
  {
    title: "Petition clipboard",
    hook: "The petition is cover for your pockets.",
    how: "A clipboard is pushed at you to sign; hands go for your bag while you write.",
    counter: "Don't take the pen. Step around; keep your bag zipped in front.",
    detail:
      "Crews work tourist squares and station forecourts, often posing as deaf or as charity workers. Aggressive donation demands follow any signature — keep your phone off the table.",
  },
  {
    title: "Fake police",
    hook: "Real officers don't ask to hold your cash.",
    how: "Plainclothes 'officers' cite money checks and ask for your wallet or passport.",
    counter: "Hand nothing over — ask for uniformed officers or call 112 to verify.",
    detail:
      "Works streets near tourist areas and occasionally trains. Offer to walk to the nearest station; genuine officers will not object. Italian police almost never handle your cash.",
  },
  {
    title: "Taxi overcharge",
    hook: "The 'broken meter' costs exactly what they say.",
    how: "Unlicensed drivers quote flat rates, take long routes, or claim the meter is broken.",
    counter: "Use official white cars from marked ranks or a licensed app; confirm the price first.",
    detail:
      "They approach inside airport and station terminals. Fixed airport tariffs are posted on the car. Some switch a €50 note for a €5 and claim you underpaid — say the amount out loud as you hand over cash.",
  },
  {
    title: "Bill padding",
    hook: "'Specials' with no price have a big one.",
    how: "Unpriced specials, seafood charged by weight, and extra items appear on the bill.",
    counter: "Order from a priced menu and read the itemized conto line by line.",
    detail:
      "Heaviest in Venice and Rome centro. Ask the price of anything quoted verbally. Coperto — a small per-person cover charge — is legal and normal; random extras are not.",
  },
  {
    title: "Pickpocket squeeze",
    hook: "Three seconds at the metro doors.",
    how: "A crush forms as you board: one blocks, one bumps, one lifts your phone.",
    counter: "Bag zipped in front, phone away before the platform, valuables under clothing.",
    detail:
      "Known runs: Rome Metro A, buses 64 and 40, Termini and Milano Centrale, the Naples Circumvesuviana, and Venice vaporetti. If jostled at the door, check pockets immediately and step back off if needed.",
  },
  {
    title: "Costumed photo",
    hook: "The gladiator charges by the frame.",
    how: "Costumed characters pose with you unasked, then demand €20–50 per person.",
    counter: "Don't accept the pose; agree any price out loud before the camera comes out.",
    detail:
      "Colosseum, Piazza del Duomo, and other landmarks. Refusal can turn loud — keep moving; they need the next tourist more than the argument.",
  },
  {
    title: "ATM helpers & skimmers",
    hook: "'That machine is broken — let me help.'",
    how: "A 'helper' warns the ATM is faulty and shoulder-surfs your PIN, or the slot is skimmed.",
    counter: "Use ATMs inside bank branches, cover the keypad, decline all help.",
    detail:
      "Standalone street ATMs and stations carry the risk. If your card is retained, call your bank immediately without leaving the machine.",
  },
  {
    title: "Rental car smash-and-grab",
    hook: "Rental plates plus visible bags equal broken glass.",
    how: "Windows are broken for bags in the minute you spend at the viewpoint.",
    counter: "Nothing visible in the cabin — ever. Load the trunk before departure.",
    detail:
      "Scenic viewpoints, beach and trailhead parking, and city garages in the south. Load up before you set off, not at the parking spot, and use staffed garages overnight.",
  },
  {
    title: "Scooter bag snatch",
    hook: "Grabbed from a passing scooter, hard enough to pull you down.",
    how: "A passenger snatches phones at ear height and bags hanging on the street side.",
    counter: "Bag on the building side, strap across the body; step into a doorway to call.",
    detail:
      "Naples and Palermo especially. Anything held at curb height is a target — keep phones out of sight near the road.",
  },
];
