import type { Metadata } from "next";
import { ChevronDown, Map } from "lucide-react";
import GuidePageHeader from "@/components/guide/GuidePageHeader";
import Icon from "@/components/Icon";
import MoreCities from "@/components/guide/MoreCities";
import TelText from "@/components/TelText";
import Callout from "@/components/ui/Callout";
import Card from "@/components/ui/Card";
import ListRow from "@/components/ui/ListRow";
import { ColonLead, ResourceLinks } from "@/components/guide/shared";
import { guideAnchor } from "@/lib/guideSections";
import { regions, type BriefItem, type RegionBrief } from "@/data/regions";

export const metadata: Metadata = { title: "Cities & regions — Field guide" };

/** One brief line: ≤90-char lead always visible, depth behind a native
 *  details element so it works with JS disabled. */
function BriefLine({ item }: { item: BriefItem }) {
  if (!item.detail) {
    return (
      <li className="body-copy text-secondary">
        <ColonLead text={item.lead} />
      </li>
    );
  }
  return (
    <li className="body-copy text-secondary">
      <details className="group/brief">
        <summary className="flex min-h-control cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0">
            <ColonLead text={item.lead} />
          </span>
          <span
            aria-hidden="true"
            className="shrink-0 text-tertiary transition-transform duration-200 ease-out group-open/brief:rotate-180 motion-reduce:transition-none"
          >
            <Icon icon={ChevronDown} size="sm" />
          </span>
        </summary>
        <p className="body-copy pb-2 pl-3 text-secondary">
          <TelText text={item.detail} />
        </p>
      </details>
    </li>
  );
}

function BriefList({ items }: { items: BriefItem[] }) {
  return (
    <ul className="mt-1 space-y-1">
      {items.map((item) => (
        <BriefLine key={item.lead} item={item} />
      ))}
    </ul>
  );
}

function RegionCard({ region }: { region: RegionBrief }) {
  return (
    <Card as="article" accentEdge id={guideAnchor(region.name)} className="guide-item scroll-mt-4">
      <h2 className="title-section">{region.name}</h2>
      <p className="body-copy mt-1 font-medium text-secondary">{region.headline}</p>
      <h3 className="eyebrow mt-3">Watch for</h3>
      <BriefList items={region.watch} />
      <h3 className="eyebrow mt-3">Moving around</h3>
      <BriefList items={region.move} />
      {region.sections?.map((sec) => (
        <div key={sec.label}>
          <h3 className="eyebrow mt-3">{sec.label}</h3>
          <BriefList items={sec.bullets} />
        </div>
      ))}
      {region.links?.length ? <ResourceLinks links={region.links} /> : null}
      {region.caveat ? <Callout className="mt-3">{region.caveat}</Callout> : null}
    </Card>
  );
}

export default function GuideCitiesPage() {
  const primary = regions.filter((r) => !r.secondary);
  const secondary = regions.filter((r) => r.secondary);

  return (
    <main data-accent="azzurro">
      <GuidePageHeader slug="cities" />
      <div className="mt-3 space-y-3">
        {primary.map((region) => (
          <RegionCard key={region.name} region={region} />
        ))}

        {/* Cross-link: this trip's ground is downloadable. */}
        <ListRow
          href="/map"
          icon={<Icon icon={Map} size="lg" />}
          title="Offline map"
          subtitle="Rome, Florence, Siena, and Tuscany packs"
        />

        <MoreCities anchors={secondary.map((r) => guideAnchor(r.name))}>
          {secondary.map((region) => (
            <RegionCard key={region.name} region={region} />
          ))}
        </MoreCities>
      </div>
    </main>
  );
}
