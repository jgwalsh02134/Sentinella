import type { Metadata } from "next";
import { Siren } from "lucide-react";
import GuidePageHeader from "@/components/guide/GuidePageHeader";
import Icon from "@/components/Icon";
import Callout from "@/components/ui/Callout";
import Card from "@/components/ui/Card";
import Disclosure from "@/components/ui/Disclosure";
import ListRow from "@/components/ui/ListRow";
import { guideAnchor } from "@/lib/guideSections";
import { scams } from "@/data/scams";

export const metadata: Metadata = { title: "Scams — Field guide" };

export default function GuideScamsPage() {
  return (
    <main data-accent="terracotta">
      <GuidePageHeader slug="scams" />

      {/* The one blanket rule — never repeated per card. */}
      <Callout className="mt-4">
        Firm &ldquo;No, grazie&rdquo; + keep walking beats every scam here.
      </Callout>

      <div className="mt-4 space-y-3">
        {scams.map((s) => (
          <Card
            key={s.title}
            as="article"
            accentEdge
            id={guideAnchor(s.title)}
            className="guide-item scroll-mt-4"
          >
            <h2 className="text-headline">{s.title}</h2>
            <p className="mt-0.5 text-subhead text-secondary">{s.hook}</p>
            <p className="body-copy mt-2 text-secondary">
              <strong className="font-semibold text-primary">How:</strong> {s.how}
            </p>
            {/* The counter is the payload — bold, never collapsed. */}
            <p className="body-copy mt-2 rounded-xl bg-accent-subtle p-3 font-bold text-accent-deep">
              Counter: {s.counter}
            </p>
            <Disclosure
              label={<span className="text-subhead font-semibold text-link">Where it runs</span>}
              className="mt-1"
            >
              <p className="body-copy text-secondary">{s.detail}</p>
            </Disclosure>
          </Card>
        ))}
      </div>

      {/* Cross-link: the aftermath lives on the Emergency screen. */}
      <ListRow
        href="/emergency#robbed"
        icon={<Icon icon={Siren} size="lg" />}
        title="If you're robbed"
        subtitle="File the denuncia — steps on the Emergency screen"
        className="mt-4"
      />
    </main>
  );
}
