import type { Metadata } from "next";
import AlertsPanel from "@/components/AlertsPanel";
import OfficialWarningsPanel from "@/components/OfficialWarningsPanel";
import SeasonalWeatherLink from "@/components/SeasonalWeatherLink";
import UsAdvisoriesPanel from "@/components/UsAdvisoriesPanel";
import NavTile from "@/components/ui/NavTile";
import SectionHeader from "@/components/ui/SectionHeader";

export const metadata: Metadata = { title: "Alerts" };

export default function AlertsPage() {
  return (
    <main>
      <SectionHeader
        level={1}
        eyebrow="Alerts"
        tile={<NavTile feature="alerts" />}
        title="Alerts & advisories"
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

      <section className="mt-8" aria-label="Official warnings for Italy" data-accent="azzurro">
        <SectionHeader title="Official warnings — Italy" />
        <div className="mt-3">
          <OfficialWarningsPanel />
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
