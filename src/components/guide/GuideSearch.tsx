"use client";

import { useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import type { ReactNode } from "react";
import GuideTile from "@/components/guide/GuideTile";
import { GuideRow, GuideRowGroup } from "@/components/guide/GuideRow";
import EmptyState from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Field";
import { buildGuideSearchIndex, type GuideSearchEntry } from "@/lib/guideSearch";

/**
 * Client-side guide search over the bundled data — fully offline, no
 * network. Empty query renders the normal index (server-rendered
 * children); a query swaps in matching items grouped by section, each
 * linking straight to the item's anchor on its detail page.
 */
export default function GuideSearch({ children }: { children: ReactNode }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const index = useMemo(buildGuideSearchIndex, []);

  const groups = useMemo(() => {
    if (!query) return [];
    const hits = index.filter((e) => e.haystack.includes(query));
    const bySection = new Map<string, GuideSearchEntry[]>();
    for (const hit of hits) {
      const list = bySection.get(hit.section) ?? [];
      list.push(hit);
      bySection.set(hit.section, list);
    }
    return Array.from(bySection.entries());
  }, [index, query]);

  return (
    <>
      <div className="mt-4">
        <Input
          type="search"
          inputMode="search"
          placeholder="Search the guide"
          aria-label="Search the guide"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {!query ? (
        children
      ) : groups.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No matches"
          body="Try 'taxi' or 'pharmacy'."
          className="mt-4"
        />
      ) : (
        <div aria-live="polite" className="mt-5 space-y-5">
          {groups.map(([section, entries]) => (
            <section key={section} aria-label={section}>
              <p className="eyebrow">{section}</p>
              <GuideRowGroup className="mt-2">
                {entries.map((e) => (
                  <GuideRow
                    key={`${e.slug}-${e.anchor}`}
                    href={`/guide/${e.slug}#${e.anchor}`}
                    tile={<GuideTile slug={e.slug} />}
                    title={e.title}
                    subtitle={e.summary}
                  />
                ))}
              </GuideRowGroup>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
