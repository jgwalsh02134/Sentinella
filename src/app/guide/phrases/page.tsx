import type { Metadata } from "next";
import GuidePageHeader from "@/components/guide/GuidePageHeader";
import ItalyFlag from "@/components/ItalyFlag";
import Card from "@/components/ui/Card";
import { guideAnchor } from "@/lib/guideSections";
import { phraseGroups } from "@/data/phrases";

export const metadata: Metadata = { title: "Phrases — Field guide" };

export default function GuidePhrasesPage() {
  return (
    <main data-accent="glicine">
      <GuidePageHeader slug="phrases" />
      {phraseGroups.map((group) => (
        <section key={group.label} aria-label={group.label} className="mt-5">
          <h2 className="text-headline">{group.label}</h2>
          <div className="mt-2 space-y-2">
            {group.phrases.map((p) => (
              <Card key={p.it} accentEdge id={guideAnchor(p.en)} className="guide-item scroll-mt-4">
                <p className="text-caption font-semibold uppercase tracking-wide text-secondary">
                  {p.en}
                </p>
                <p className="mt-1 text-title text-accent-deep">
                  <ItalyFlag /> <i lang="it">{p.it}</i>
                </p>
                <p className="mt-1 text-subhead italic text-secondary">{p.say}</p>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
