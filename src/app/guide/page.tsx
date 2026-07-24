import type { Metadata } from "next";
import GuideTabs from "@/components/GuideTabs";
import NavTile from "@/components/ui/NavTile";
import SectionHeader from "@/components/ui/SectionHeader";

export const metadata: Metadata = { title: "Field guide" };

export default function GuidePage() {
  return (
    <main>
      <SectionHeader
        level={1}
        eyebrow="Field guide"
        tile={<NavTile feature="guide" />}
        title="Know it before you need it"
        intro="Situational basics, the scams that actually run, emergency Italian, city briefings, and how healthcare works. Loads once, then works offline."
      />
      <p className="mt-2 text-footnote text-secondary">
        External links open in your browser and need a connection — the guide itself doesn&apos;t.
      </p>
      <div className="mt-5">
        <GuideTabs />
      </div>
    </main>
  );
}
