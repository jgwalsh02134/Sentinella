import type { Metadata } from "next";
import AlertsPanel from "@/components/AlertsPanel";
import SeasonalWeatherLink from "@/components/SeasonalWeatherLink";
import UsAdvisoriesPanel from "@/components/UsAdvisoriesPanel";

export const metadata: Metadata = { title: "Alerts" };

export default function AlertsPage() {
  return (
    <main>
      <header>
        <p className="eyebrow">Alerts</p>
        <h1 className="title-page">Active advisories</h1>
        <p className="body-copy mt-1 text-secondary">
          Advisories from your group's admins and official U.S. government sources, in one place.
        </p>
      </header>

      <div className="mt-4">
        <SeasonalWeatherLink />
      </div>

      <section className="mt-4" aria-label="Team advisories">
        <h2 className="eyebrow">Team advisories</h2>
        <div className="mt-2">
          <AlertsPanel />
        </div>
      </section>

      <section className="mt-6" aria-label="Official U.S. Department of State advisories" data-accent="azzurro">
        <h2 className="eyebrow">Official — U.S. Department of State</h2>
        <div className="mt-2">
          <UsAdvisoriesPanel />
        </div>
      </section>
    </main>
  );
}
