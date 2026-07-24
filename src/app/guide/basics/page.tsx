import type { Metadata } from "next";
import { Fragment } from "react";
import GuidePageHeader from "@/components/guide/GuidePageHeader";
import InfoCard from "@/components/guide/InfoCard";
import SeasonalWeatherCard from "@/components/SeasonalWeatherCard";
import WhereAreUCard from "@/components/WhereAreUCard";
import { basicsItems } from "@/data/health";

export const metadata: Metadata = { title: "Basics — Field guide" };

export default function GuideBasicsPage() {
  return (
    <main data-accent="oliva">
      <GuidePageHeader slug="basics" />
      <div className="mt-3 space-y-3">
        <SeasonalWeatherCard />
        {basicsItems.map((item, i) => (
          <Fragment key={item.title}>
            <InfoCard item={item} />
            {/* The shared 112 Where ARE U card — one source of truth with
                the Emergency screen — rides right after the 112 item. */}
            {i === 0 ? <WhereAreUCard headingLevel={2} /> : null}
          </Fragment>
        ))}
      </div>
      <p className="mt-4 text-footnote text-secondary">
        External links open in your browser and need a connection — the guide itself doesn&apos;t.
      </p>
    </main>
  );
}
