import Callout from "@/components/ui/Callout";
import Card from "@/components/ui/Card";
import TelText from "@/components/TelText";
import { ColonLead, LeadBody, ResourceLinks } from "@/components/guide/shared";
import { guideAnchor } from "@/lib/guideSections";
import type { InfoItem } from "@/data/health";

/** Basics and Health share one card layout; each card is an anchor
 *  target so search can deep-link to it. */
export default function InfoCard({ item }: { item: InfoItem }) {
  return (
    <Card as="article" accentEdge id={guideAnchor(item.title)} className="guide-item scroll-mt-4">
      <h2 className="text-headline">{item.title}</h2>
      <p className="body-copy mt-2 text-secondary">
        <LeadBody text={item.body} />
      </p>
      {item.bullets?.length ? (
        <ul className="mt-2 space-y-2">
          {item.bullets.map((b) => (
            <li key={b} className="body-copy text-secondary">
              <ColonLead text={b} />
            </li>
          ))}
        </ul>
      ) : null}
      {item.warning ? (
        <Callout className="mt-3">
          <TelText text={item.warning} />
        </Callout>
      ) : null}
      {item.links?.length ? <ResourceLinks links={item.links} /> : null}
    </Card>
  );
}
