import { Building2, Compass, HeartPulse, MessageCircle, ShieldAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { basicsItems, healthItems } from "@/data/health";
import { phraseGroups } from "@/data/phrases";
import { regions } from "@/data/regions";
import { scams } from "@/data/scams";

/**
 * The guide's section registry — one source of truth for the index rows,
 * the detail-page headers, search grouping, and the service-worker
 * precache list (mirror any slug change in public/sw.js PRECACHE).
 *
 * Accents follow the .cursorrules guide domain bindings: Basics=oliva,
 * Scams=terracotta, Phrases=glicine, Cities=azzurro, Health=verde.
 * Health keeps verde (the rules' binding) — the tile glyph is HeartPulse,
 * never a green cross, which means pharmacy in Italy.
 */

export type GuideSlug = "basics" | "scams" | "phrases" | "cities" | "health";

export type GuideSection = {
  slug: GuideSlug;
  /** Row title on the index. */
  title: string;
  /** Detail page h1. */
  heading: string;
  /** ≤6-word index descriptor. */
  descriptor: string;
  accent: "oliva" | "terracotta" | "glicine" | "azzurro" | "verde";
  icon: LucideIcon;
  count: number;
  group: "essentials" | "reference";
};

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    slug: "scams",
    title: "Scams",
    heading: "The scams that actually run",
    descriptor: "The 10 that actually run",
    accent: "terracotta",
    icon: ShieldAlert,
    count: scams.length,
    group: "essentials",
  },
  {
    slug: "phrases",
    title: "Phrases",
    heading: "Emergency Italian",
    descriptor: "Say it or show it",
    accent: "glicine",
    icon: MessageCircle,
    count: phraseGroups.reduce((n, g) => n + g.phrases.length, 0),
    group: "essentials",
  },
  {
    slug: "basics",
    title: "Basics",
    heading: "Situational basics",
    descriptor: "Strikes, ZTL, tickets, quakes",
    accent: "oliva",
    icon: Compass,
    count: basicsItems.length,
    group: "essentials",
  },
  {
    slug: "cities",
    title: "Cities & regions",
    heading: "City briefings",
    descriptor: "Rome, Florence, Tuscany first",
    accent: "azzurro",
    icon: Building2,
    count: regions.length,
    group: "reference",
  },
  {
    slug: "health",
    title: "Health",
    heading: "How healthcare works",
    descriptor: "ERs, pharmacies, tap water",
    accent: "verde",
    icon: HeartPulse,
    count: healthItems.length,
    group: "reference",
  },
];

export function guideSection(slug: GuideSlug): GuideSection {
  return GUIDE_SECTIONS.find((s) => s.slug === slug)!;
}

/** Anchor id for a guide item — search links and :target highlighting. */
export function guideAnchor(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
