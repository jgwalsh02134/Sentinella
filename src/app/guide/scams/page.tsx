import type { Metadata } from "next";
import GuidePageHeader from "@/components/guide/GuidePageHeader";
import Card from "@/components/ui/Card";
import { guideAnchor } from "@/lib/guideSections";
import { scams } from "@/data/scams";

export const metadata: Metadata = { title: "Scams — Field guide" };

export default function GuideScamsPage() {
  return (
    <main data-accent="terracotta">
      <GuidePageHeader slug="scams" />
      <div className="mt-3 space-y-3">
        {scams.map((s) => (
          <Card
            key={s.title}
            as="article"
            accentEdge
            id={guideAnchor(s.title)}
            className="guide-item scroll-mt-4"
          >
            <h2 className="text-headline">{s.title}</h2>
            <p className="mt-1 text-caption font-semibold uppercase tracking-wide text-secondary">
              {s.where}
            </p>
            <p className="body-copy mt-2 text-secondary">{s.how}</p>
            <p className="body-copy mt-2 rounded-xl bg-accent-subtle p-3 text-accent-deep">
              <strong className="font-bold">Counter:</strong> {s.counter}
            </p>
          </Card>
        ))}
      </div>
    </main>
  );
}
