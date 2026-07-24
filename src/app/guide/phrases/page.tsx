import type { Metadata } from "next";
import GuidePageHeader from "@/components/guide/GuidePageHeader";
import PhraseList from "@/components/guide/PhraseList";

export const metadata: Metadata = { title: "Phrases — Field guide" };

export default function GuidePhrasesPage() {
  return (
    <main data-accent="glicine">
      <GuidePageHeader slug="phrases" />
      <p className="mt-2 text-footnote text-secondary">
        Tap any phrase to show it full screen — big enough to hand the phone to an Italian.
      </p>
      <PhraseList />
    </main>
  );
}
