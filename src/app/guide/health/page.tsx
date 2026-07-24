import type { Metadata } from "next";
import { PhoneCall } from "lucide-react";
import GuidePageHeader from "@/components/guide/GuidePageHeader";
import Icon from "@/components/Icon";
import InfoCard from "@/components/guide/InfoCard";
import ListRow from "@/components/ui/ListRow";
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

        {/* Cross-link: the callable plate lives on the Emergency screen. */}
        <ListRow
          href="/emergency#numbers"
          icon={<Icon icon={PhoneCall} size="lg" />}
          title="Call 116 117 — out-of-hours doctor"
          subtitle="The plate is on the Emergency screen"
        />
      </div>
      <p className="mt-4 text-footnote text-secondary">
        External links open in your browser and need a connection — the guide itself doesn&apos;t.
      </p>
    </main>
  );
}
