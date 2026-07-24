import type { Metadata } from "next";
import GuidePageHeader from "@/components/guide/GuidePageHeader";
import Callout from "@/components/ui/Callout";
import Card from "@/components/ui/Card";
import { ColonLead, ResourceLinks } from "@/components/guide/shared";
import { guideAnchor } from "@/lib/guideSections";
import { regions, type RegionBrief } from "@/data/regions";

export const metadata: Metadata = { title: "Cities & regions — Field guide" };

function RegionCard({ region }: { region: RegionBrief }) {
  return (
    <Card as="article" accentEdge id={guideAnchor(region.name)} className="guide-item scroll-mt-4">
      <h2 className="title-section">{region.name}</h2>
      <p className="body-copy mt-1 font-medium text-secondary">{region.headline}</p>
      <h3 className="eyebrow mt-3">Watch for</h3>
      <ul className="mt-1 space-y-2">
        {region.watch.map((w) => (
          <li key={w} className="body-copy text-secondary">
            <ColonLead text={w} />
          </li>
        ))}
      </ul>
      <h3 className="eyebrow mt-3">Moving around</h3>
      <ul className="mt-1 space-y-2">
        {region.move.map((m) => (
          <li key={m} className="body-copy text-secondary">
            <ColonLead text={m} />
          </li>
        ))}
      </ul>
      {region.sections?.map((sec) => (
        <div key={sec.label}>
          <h3 className="eyebrow mt-3">{sec.label}</h3>
          <ul className="mt-1 space-y-2">
            {sec.bullets.map((b) => (
              <li key={b} className="body-copy text-secondary">
                <ColonLead text={b} />
              </li>
            ))}
          </ul>
        </div>
      ))}
      {region.links?.length ? <ResourceLinks links={region.links} /> : null}
      {region.caveat ? <Callout className="mt-3">{region.caveat}</Callout> : null}
    </Card>
  );
}

export default function GuideCitiesPage() {
  return (
    <main data-accent="azzurro">
      <GuidePageHeader slug="cities" />
      <div className="mt-3 space-y-3">
        {regions.map((region) => (
          <RegionCard key={region.name} region={region} />
        ))}
      </div>
    </main>
  );
}
