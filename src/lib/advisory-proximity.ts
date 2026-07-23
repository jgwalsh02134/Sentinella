/**
 * Matches a check-in position against active advisories from both sources
 * (team alerts and official U.S. items) so the caution can be shown the
 * moment someone checks in. Server-side only (queries the DB).
 */
import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { alerts, externalAdvisories } from "@/db/schema";
import { nearestRegion } from "@/lib/region-geo";

export type NearbyAdvisory = {
  source: "team" | "official";
  title: string;
  /** Team severity or "Level N" for the State advisory; embassy items omit it. */
  badge: string | null;
  url: string | null;
};

const TEAM_WINDOW_DAYS = 14;
const OFFICIAL_WINDOW_DAYS = 30;

export async function advisoriesNear(lat: number, lng: number): Promise<NearbyAdvisory[]> {
  const region = nearestRegion(lat, lng);
  const out: NearbyAdvisory[] = [];

  const teamSince = new Date(Date.now() - TEAM_WINDOW_DAYS * 86_400_000);
  const teamRows = await db
    .select()
    .from(alerts)
    .where(and(eq(alerts.active, true), gte(alerts.createdAt, teamSince)))
    .orderBy(desc(alerts.createdAt))
    .limit(20);
  for (const a of teamRows) {
    const r = a.region.toLowerCase();
    const matches =
      r === "nationwide" || r === "italy" || (region !== null && r.includes(region.toLowerCase()));
    if (matches) out.push({ source: "team", title: a.title, badge: a.severity, url: "/alerts" });
  }

  const officialSince = new Date(Date.now() - OFFICIAL_WINDOW_DAYS * 86_400_000);
  const officialRows = await db
    .select()
    .from(externalAdvisories)
    .orderBy(desc(externalAdvisories.publishedAt))
    .limit(50);
  for (const item of officialRows) {
    if (item.source === "state_advisory") {
      // The standing country advisory only warrants a post-check-in caution
      // at Reconsider Travel or above; Level 1–2 would banner every check-in.
      if ((item.level ?? 0) >= 3) {
        out.push({ source: "official", title: item.title, badge: `Level ${item.level}`, url: item.url });
      }
      continue;
    }
    const fresh = item.publishedAt !== null && item.publishedAt >= officialSince;
    if (fresh && region !== null && item.regions.includes(region)) {
      out.push({ source: "official", title: item.title, badge: null, url: item.url });
    }
  }

  return out.slice(0, 5);
}
