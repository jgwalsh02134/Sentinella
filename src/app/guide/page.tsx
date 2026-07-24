import type { Metadata } from "next";
import GuideTabs from "@/components/GuideTabs";

export const metadata: Metadata = { title: "Field guide" };

export default function GuidePage() {
  return (
    <main>
      <header>
        <p className="eyebrow">Field guide</p>
        <h1 className="title-page">Know it before you need it</h1>
        <p className="body-copy mt-1 text-secondary">
          Situational basics, the scams that actually run, emergency Italian, city briefings, and
          how healthcare works. Loads once, then works offline.
        </p>
        <p className="mt-1 text-xs leading-relaxed text-secondary">
          External links open in your browser and need a connection — the guide itself doesn&apos;t.
        </p>
      </header>
      <div className="mt-4">
        <GuideTabs />
      </div>
    </main>
  );
}
