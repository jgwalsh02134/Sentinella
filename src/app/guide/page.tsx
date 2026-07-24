import type { Metadata } from "next";
import GuideHashRedirect from "@/components/guide/GuideHashRedirect";
import GuideTile from "@/components/guide/GuideTile";
import ListRow from "@/components/ui/ListRow";
import NavTile from "@/components/ui/NavTile";
import SectionHeader from "@/components/ui/SectionHeader";
import { GUIDE_SECTIONS } from "@/lib/guideSections";

export const metadata: Metadata = { title: "Field guide" };

export default function GuidePage() {
  return (
    <main>
      <GuideHashRedirect />
      <SectionHeader
        level={1}
        eyebrow="Field guide"
        tile={<NavTile feature="guide" />}
        title="Know it before you need it"
      />
      <div className="mt-4 space-y-3">
        {GUIDE_SECTIONS.map((s) => (
          <ListRow
            key={s.slug}
            href={`/guide/${s.slug}`}
            icon={<GuideTile slug={s.slug} />}
            title={s.title}
            subtitle={s.descriptor}
            value={s.count}
          />
        ))}
      </div>
      <p className="mt-3 text-footnote text-secondary">
        Loads once, then works offline. External links need a connection — the guide doesn&apos;t.
      </p>
    </main>
  );
}
