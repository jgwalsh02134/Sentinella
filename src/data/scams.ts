export type Scam = {
  title: string;
  where: string;
  how: string;
  counter: string;
};

export const scams: Scam[] = [
  {
    title: "Friendship bracelet",
    where: "Outside major sights — Colosseum, Duomo di Milano, Ponte Vecchio, Spanish Steps",
    how: "Someone ties a bracelet onto your wrist 'as a gift', then demands payment and makes a scene. An accomplice may work your pockets while you argue.",
    counter: "Keep hands in pockets or crossed near known spots, keep walking, and a firm 'No, grazie' without stopping. Never let anyone put anything on you.",
  },
  {
    title: "Petition clipboard",
    where: "Tourist squares and outside train stations",
    how: "A group, often posing as deaf or as charity workers, pushes a clipboard at you. The petition is cover — while you sign, hands go for your bag or phone, or aggressive donation demands follow.",
    counter: "Don't take the pen. Step around, keep your phone off the table and your bag zipped in front of you.",
  },
  {
    title: "Fake police",
    where: "Streets near tourist areas, occasionally trains",
    how: "Plainclothes 'officers' flash a card, cite counterfeit money or drug checks, and ask to inspect your wallet or passport. Real Italian police almost never ask to handle your cash.",
    counter: "Stay calm, don't hand over your wallet. Ask for uniformed officers and offer to walk to the nearest station, or call 112 to verify. Genuine officers will not object.",
  },
  {
    title: "Taxi overcharge",
    where: "Airports, stations, nightlife districts",
    how: "Unlicensed drivers approach inside terminals, quote inflated flat rates, take long routes, or claim the meter is broken. Some switch a €50 note for a €5 and claim you underpaid.",
    counter: "Use only official ranks — white cars with a roof sign and meter — or a licensed app. Fixed airport tariffs are posted on the car; confirm the price before moving. Say the amount out loud as you hand over cash.",
  },
  {
    title: "Bill padding",
    where: "Restaurants in heavy tourist zones, especially Venice and Rome centro",
    how: "Unpriced 'specials', seafood charged by weight without warning, or extra items appearing on the bill. Note: coperto (a small per-person cover charge) is legal and normal — random extras are not.",
    counter: "Order from a priced menu, ask the price of anything quoted verbally, and read the itemized bill (conto) line by line before paying.",
  },
  {
    title: "Pickpocket squeeze",
    where: "Rome Metro A, bus 64/40, Termini and Milano Centrale, Naples Circumvesuviana, Venice vaporetti",
    how: "Coordinated groups create a crush at the doors as you board. One blocks, one bumps, one lifts your phone or wallet in the three seconds before the doors close.",
    counter: "Bag worn in front and zipped, phone away before the platform, valuables in a front pocket or under clothing. If jostled at the door, check pockets immediately and step back off if needed.",
  },
  {
    title: "Costumed photo",
    where: "Colosseum, Piazza del Duomo, other landmarks",
    how: "Gladiators or mascots pose with you unasked, then demand €20–50 per person for the photo, getting aggressive if refused.",
    counter: "Don't accept the pose. If a price is ever involved, agree on it out loud before the camera comes out.",
  },
  {
    title: "ATM helpers & skimmers",
    where: "Standalone street ATMs, stations",
    how: "A 'helpful' stranger warns the machine is faulty and offers to assist while shoulder-surfing your PIN, or the ATM itself carries a skimmer.",
    counter: "Use ATMs inside bank branches (Bancomat) during opening hours, cover the keypad with your other hand, and decline all help. If your card is retained, call the bank immediately without leaving the machine.",
  },
  {
    title: "Rental car smash-and-grab",
    where: "Scenic viewpoints, beach and trailhead parking, city garages in the south",
    how: "Rental plates and visible luggage mark the car. Windows are broken for bags in the minute you spend at the viewpoint.",
    counter: "Nothing visible in the cabin — ever. Load the trunk before departure, not at the parking spot, and use staffed garages overnight.",
  },
  {
    title: "Scooter bag snatch",
    where: "Naples and Palermo especially, near curbs",
    how: "A passenger on a passing scooter grabs phones held at ear height or bags hanging on the street side, hard enough to pull you down.",
    counter: "Walk with your bag on the building side, strap across the body, and step into a doorway to use your phone.",
  },
];
