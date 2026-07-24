import Callout from "@/components/ui/Callout";
import Card from "@/components/ui/Card";
import Disclosure from "@/components/ui/Disclosure";
import TelText from "@/components/TelText";
import { ColonLead, ResourceLinks } from "@/components/guide/shared";
import { guideAnchor } from "@/lib/guideSections";
import type { InfoItem } from "@/data/health";

/**
 * Basics and Health share one card layout (the /prepare pattern): title,
 * bold one-line summary and any warning always visible, depth behind a
 * Disclosure. Steps render numbered — only real sequences carry steps.
 * Each card is an anchor target so search can deep-link to it.
 */
export default function InfoCard({ item }: { item: InfoItem }) {
  const hasDepth = Boolean(item.detail || item.bullets?.length || item.steps?.length || item.links?.length);

  return (
    <Card as="article" accentEdge id={guideAnchor(item.title)} className="guide-item scroll-mt-4">
      <h2 className="text-headline">{item.title}</h2>
      <p className="body-copy mt-1 font-bold text-primary">
        <TelText text={item.summary} />
      </p>
      {item.warning ? (
        <Callout className="mt-3">
          <TelText text={item.warning} />
        </Callout>
      ) : null}
      {item.steps?.length ? (
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          {item.steps.map((s) => (
            <li key={s} className="body-copy text-secondary">
              {s}
            </li>
          ))}
        </ol>
      ) : null}
      {hasDepth && !item.steps?.length ? (
        <Disclosure label={<span className="text-subhead font-semibold text-link">Details</span>} className="mt-1">
          {item.detail ? (
            <p className="body-copy text-secondary">
              <TelText text={item.detail} />
            </p>
          ) : null}
          {item.bullets?.length ? (
            <ul className="mt-2 space-y-2">
              {item.bullets.map((b) => (
                <li key={b} className="body-copy text-secondary">
                  <ColonLead text={b} />
                </li>
              ))}
            </ul>
          ) : null}
          {item.links?.length ? <ResourceLinks links={item.links} /> : null}
        </Disclosure>
      ) : null}
    </Card>
  );
}
