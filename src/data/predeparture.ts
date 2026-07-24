/**
 * "Before you fly" pre-departure checklist — static typed content, bundled
 * so it works offline like the rest of the safety data (do not move to the
 * database). Facts verified July 2026 for a US → Italy trip; update
 * lastVerified whenever content is re-checked.
 */

export type PrepLink = {
  label: string;
  href: string;
};

export type PrepItem = {
  /** Stable id — used as the checklist storage key; never reuse. */
  id: string;
  title: string;
  body: string;
  links: PrepLink[];
};

export type PrepSection = {
  id: string;
  title: string;
  items: PrepItem[];
};

export const lastVerified = "July 2026";

export const predeparture: PrepSection[] = [
  {
    id: "entry-rules",
    title: "Entry rules — what changed in 2026",
    items: [
      {
        id: "etias",
        title: "ETIAS: not required for this trip",
        body:
          "The EU removed its \"late 2026\" launch target in July 2026; launch is now expected in 2027, with a revised timeline due after a September 2026 eu-LISA board meeting. There is nothing to apply for.\n" +
          "Any website selling \"ETIAS\" today is a scam — the only official source is the EU's page below. Even when ETIAS launches, a transitional period of at least 6 months means travelers without one are not refused entry. When it does launch it costs €20 (under-18 and 70+ are exempt, so travelers aged 60–69 will pay).",
        links: [{ label: "Official ETIAS page (europa.eu)", href: "https://travel-europe.europa.eu/etias" }],
      },
      {
        id: "ees",
        title: "EES biometrics: in force",
        body:
          "Fully operational since April 10, 2026. First entry into the Schengen area means a facial photo and fingerprints instead of a passport stamp — budget extra time in the arrival line at Rome Fiumicino. Data is kept 3 years, so later entries are a faster face check.\n" +
          "Global Entry does NOT speed up Schengen entry.",
        links: [],
      },
      {
        id: "passport",
        title: "Passport validity",
        body:
          "Valid at least 3 months beyond your departure from the Schengen area (6 months recommended), issued within the last 10 years, with 2 blank pages.",
        links: [],
      },
    ],
  },
  {
    id: "global-entry",
    title: "You have Global Entry — use it on the way home",
    items: [
      {
        id: "ge-arrival",
        title: "At JFK/EWR arrival",
        body:
          "Use the Global Entry facial-comparison touchless portals; you generally don't need the physical card at the airport — passport + face match suffices.",
        links: [],
      },
      {
        id: "ge-ktn",
        title: "Before departure",
        body:
          "Confirm your Known Traveler Number is on every airline booking so TSA PreCheck applies at JFK/EWR.",
        links: [],
      },
    ],
  },
  {
    id: "health",
    title: "Health prep for travelers 60+",
    items: [
      {
        id: "insurance",
        title: "Insurance — Medicare stops at the border",
        body:
          "Medicare does not cover care abroad. If you have a Medigap plan (C/D/F/G/M/N), its foreign-emergency benefit is capped at a $50,000 lifetime limit, pays 80% after a $250 deductible, covers only the first 60 days of travel, and excludes medical evacuation.\n" +
          "Buy travel medical insurance with a medical-evacuation benefit of at least $100,000 and acute-onset-of-pre-existing-condition coverage. Italian hospitals may require up-front payment from uninsured foreigners.",
        links: [],
      },
      {
        id: "medications",
        title: "Medications",
        body:
          "Carry everything in original packaging with a copy of each prescription; a ~30-day personal-use supply is the safe benchmark.\n" +
          "Controlled substances (opioids, benzodiazepines, ADHD stimulants) additionally need a certificate from your home health authority based on a valid prescription — max 30 days' validity, one certificate per substance. Never mail medication to Italy.",
        links: [],
      },
      {
        id: "vaccines",
        title: "Vaccines",
        body:
          "Get the 2026–27 flu shot about 2 weeks before an October departure (flu season). Updated COVID-19 vaccine per CDC guidance for older adults. RSV is a single dose recommended at 75+ or at 50–74 with risk conditions (no repeat dose if already received). Confirm shingles (Shingrix), pneumococcal, and MMR immunity are current.",
        links: [],
      },
      {
        id: "dvt",
        title: "Long-haul DVT prevention",
        body:
          "On the 8–9 hour flight: walk hourly, do seated calf raises, hydrate, limit alcohol, and consider graduated compression socks.",
        links: [],
      },
    ],
  },
  {
    id: "setup",
    title: "Set up before leaving US soil",
    items: [
      {
        id: "step",
        title: "Enroll in STEP",
        body: "Embassy alerts, plus an easier way for the embassy to reach you in an emergency.",
        links: [{ label: "step.state.gov", href: "https://step.state.gov" }],
      },
      {
        id: "esim",
        title: "Install a travel eSIM before flying",
        body:
          "Airalo Eurolink, Saily, or Ubigi work well for Italy; avoid Holafly's Italy \"unlimited\" plan — it's widely reported to throttle heavily. Your US number stays active for calls and texts via Wi-Fi.",
        links: [],
      },
      {
        id: "banks-offline",
        title: "Banks and offline content",
        body:
          "Notify banks of travel dates. Download this app's offline content and maps while on home Wi-Fi.",
        links: [{ label: "Download offline city maps", href: "/map" }],
      },
    ],
  },
];
