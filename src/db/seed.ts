/**
 * Seeds sample safety alerts so the Alerts screen has content on first run.
 *
 *   Local:    npm run db:seed
 *   Railway:  railway run npm run db:seed
 *
 * The samples are generic and clearly illustrative — replace them with real
 * advisories through the admin form on the Alerts screen.
 */
import { db } from "./index";
import { alerts } from "./schema";

async function main() {
  const existing = await db.select().from(alerts).limit(1);
  if (existing.length > 0) {
    console.log("Alerts table already has data — skipping seed.");
    return;
  }

  await db.insert(alerts).values([
    {
      title: "Sample: National transport strike announced",
      body: "A 24-hour public transport strike has been announced for Friday. Guaranteed service windows typically run 06:00–09:00 and 18:00–21:00. Confirm your trains with Trenitalia or Italo the evening before and allow extra time to airports.",
      severity: "advisory",
      region: "Nationwide",
    },
    {
      title: "Sample: Heat advisory — hydrate and plan shade",
      body: "Temperatures above 37°C expected across central and southern regions through the weekend. Plan outdoor activities before 11:00, carry water, and check on any travelers with health conditions.",
      severity: "advisory",
      region: "Central & South",
    },
    {
      title: "Sample: Acqua alta season in Venice",
      body: "Seasonal tidal flooding is possible October through January. Sirens announce significant tides; raised walkways are deployed on main routes. Waterproof footwear recommended.",
      severity: "info",
      region: "Venice",
    },
  ]);

  console.log("Seeded 3 sample alerts.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
