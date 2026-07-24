import type { Metadata } from "next";
import { Footprints } from "lucide-react";
import GuideHashRedirect from "@/components/guide/GuideHashRedirect";
import GuideSearch from "@/components/guide/GuideSearch";
import GuideTile from "@/components/guide/GuideTile";
import { GuideRow, GuideRowGroup } from "@/components/guide/GuideRow";
import Icon from "@/components/Icon";
import SeasonalWeatherLink from "@/components/SeasonalWeatherLink";
import NavTile from "@/components/ui/NavTile";
import SectionHeader from "@/components/ui/SectionHeader";
import { GUIDE_SECTIONS, guideAnchor, type GuideSection } from "@/lib/guideSections";

export const metadata: Metadata = { title: "Field guide" };

function sectionRow(s: GuideSection) {
  return (
    <GuideRow
      key={s.slug}
      href={`/guide/${s.slug}`}
      tile={<GuideTile slug={s.slug} />}
      title={s.title}
      subtitle={s.descriptor}
      value={s.count}
    />
  );
}

export default function GuidePage() {
  const essentials = GUIDE_SECTIONS.filter((s) => s.group === "essentials");
  const reference = GUIDE_SECTIONS.filter((s) => s.group === "reference");

  return (
    <main>
      <GuideHashRedirect />
      <SectionHeader
        level={1}
        eyebrow="Field guide"
        tile={<NavTile feature="guide" />}
        title="Know it before you need it"
      />
      <p className="mt-2 text-footnote text-secondary">
        Loads once, then works offline. External links need a connection — the guide doesn&apos;t.
      </p>

      <GuideSearch>
        <section className="mt-6" aria-label="Essentials">
          <SectionHeader title="Essentials" />
          <div className="mt-3 space-y-3">
            <SeasonalWeatherLink subtitle="Seasonal weather safety" />
            <GuideRowGroup>{essentials.map(sectionRow)}</GuideRowGroup>
          </div>
        </section>

        <section className="mt-8" aria-label="Reference">
          <SectionHeader title="Reference" />
          <GuideRowGroup className="mt-3">
            {reference.map(sectionRow)}
            {/* "Traveling at 60+" lives in Health's data — promoted to its
                own row here because it's this trip's audience. */}
            <GuideRow
              href={`/guide/health#${guideAnchor("Traveling at 60+")}`}
              tile={
                <span
                  aria-hidden="true"
                  data-accent="verde"
                  className="flex h-tile w-tile shrink-0 items-center justify-center rounded-tile bg-accent text-on-accent"
                >
                  <Icon icon={Footprints} size="sm" />
                </span>
              }
              title="Traveling at 60+"
              subtitle="Pace, meds, pharmacies, discounts"
            />
          </GuideRowGroup>
        </section>
      </GuideSearch>
    </main>
  );
}
