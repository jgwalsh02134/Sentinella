import type { Metadata } from "next";
import AlertsPanel from "@/components/AlertsPanel";

export const metadata: Metadata = { title: "Alerts" };

export default function AlertsPage() {
  return (
    <main>
      <header>
        <p className="eyebrow">Alerts</p>
        <h1 className="text-2xl font-extrabold tracking-tight">Active advisories</h1>
        <p className="mt-1 text-sm leading-relaxed text-mist">
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
