import type { Metadata } from "next";
import GuideTabs from "@/components/GuideTabs";

export const metadata: Metadata = { title: "Field guide" };

export default function GuidePage() {
  return (
    <main>
      <header>
        <p className="eyebrow">Field guide</p>
        <h1 className="text-2xl font-extrabold tracking-tight">Know it before you need it</h1>
        <p className="mt-1 text-sm leading-relaxed text-mist">
          Situational basics, the scams that actually run, emergency Italian, city briefings, and
          how healthcare works. Loads once, then works offline.
        </p>
      </header>
      <div className="mt-4">
        <GuideTabs />
      </div>
    </main>
  );
}
