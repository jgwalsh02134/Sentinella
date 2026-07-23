import type { Metadata } from "next";
import AlertsPanel from "@/components/AlertsPanel";

export const metadata: Metadata = { title: "Alerts" };

export default function AlertsPage() {
  return (
    <main>
      <header>
        <p className="eyebrow">Alerts</p>
        <h1 className="title-page">Active advisories</h1>
        <p className="body-copy mt-1 text-mist">
          Published for this traveler group: strikes, weather, and local conditions that change
          plans.
        </p>
      </header>
      <div className="mt-4">
        <AlertsPanel />
      </div>
    </main>
  );
}
