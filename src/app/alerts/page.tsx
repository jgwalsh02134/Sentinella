import type { Metadata } from "next";
import AlertsPanel from "@/components/AlertsPanel";
import SeasonalWeatherLink from "@/components/SeasonalWeatherLink";
import UsAdvisoriesPanel from "@/components/UsAdvisoriesPanel";
import SectionHeader from "@/components/ui/SectionHeader";

export const metadata: Metadata = { title: "Alerts" };

export default function AlertsPage() {
  return (
    <main>
      <SectionHeader
        level={1}
        eyebrow="Alerts"
        title="Alerts & advisories"
        intro="Alerts from your group's admins and advisories from official U.S. sources, in one place."
      />

      <div className="mt-5">
        <SeasonalWeatherLink />
      </div>

      <section className="mt-8" aria-label="Team alerts">
        <SectionHeader title="Team alerts" />
        <div className="mt-3">
          <AlertsPanel />
        </div>
      </section>

      <section className="mt-8" aria-label="Official U.S. Department of State advisories" data-accent="azzurro">
        <SectionHeader title="Official — U.S. Department of State" />
        <div className="mt-3">
          <UsAdvisoriesPanel />
        </div>
      </section>
    </main>
  );
}
