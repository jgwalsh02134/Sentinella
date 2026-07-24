import { basicsItems, healthItems, type InfoItem } from "@/data/health";
import { phraseGroups } from "@/data/phrases";
import { regions } from "@/data/regions";
import { scams } from "@/data/scams";
import { guideAnchor, guideSection, type GuideSlug } from "@/lib/guideSections";

/**
 * The guide's search index — built from the same bundled data the detail
 * pages render, so search works fully offline. Each entry deep-links to
 * the item's anchor on its detail page.
 */

export type GuideSearchEntry = {
  slug: GuideSlug;
  /** Section heading the result is grouped under. */
  section: string;
  title: string;
  /** One display line under the title. */
  summary: string;
  /** Lowercased text the query is matched against. */
  haystack: string;
  anchor: string;
};

function clip(text: string, max = 90): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function infoEntries(items: InfoItem[], slug: GuideSlug): GuideSearchEntry[] {
  const section = guideSection(slug).title;
  return items.map((item) => ({
    slug,
    section,
    title: item.title,
    summary: clip(item.body),
    haystack: `${item.title} ${item.body} ${item.bullets?.join(" ") ?? ""}`.toLowerCase(),
    anchor: guideAnchor(item.title),
  }));
}

export function buildGuideSearchIndex(): GuideSearchEntry[] {
  return [
    ...scams.map((s) => ({
      slug: "scams" as const,
      section: "Scams",
      title: s.title,
      summary: clip(s.how),
      haystack: `${s.title} ${s.where} ${s.how} ${s.counter}`.toLowerCase(),
      anchor: guideAnchor(s.title),
    })),
    ...phraseGroups.flatMap((group) =>
      group.phrases.map((p) => ({
        slug: "phrases" as const,
        section: "Phrases",
        title: p.it,
        summary: `${p.en} · ${p.say}`,
        haystack: `${p.en} ${p.it} ${p.say}`.toLowerCase(),
        anchor: guideAnchor(p.en),
      })),
    ),
    ...infoEntries(basicsItems, "basics"),
    ...regions.map((r) => ({
      slug: "cities" as const,
      section: "Cities & regions",
      title: r.name,
      summary: clip(r.headline),
      haystack: `${r.name} ${r.headline} ${r.watch.join(" ")} ${r.move.join(" ")}`.toLowerCase(),
      anchor: guideAnchor(r.name),
    })),
    ...infoEntries(healthItems, "health"),
  ];
}
