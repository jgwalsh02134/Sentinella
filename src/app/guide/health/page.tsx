import type { Metadata } from "next";
import GuidePageHeader from "@/components/guide/GuidePageHeader";
import InfoCard from "@/components/guide/InfoCard";
import { healthItems } from "@/data/health";

export const metadata: Metadata = { title: "Health — Field guide" };

export default function GuideHealthPage() {
  return (
    <main data-accent="verde">
      <GuidePageHeader slug="health" />
      <div className="mt-3 space-y-3">
        {healthItems.map((item) => (
          <InfoCard key={item.title} item={item} />
        ))}
      </div>
    </main>
  );
}
