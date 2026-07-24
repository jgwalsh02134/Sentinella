import type { Metadata } from "next";
import PrepareChecklist from "@/components/PrepareChecklist";
import Callout from "@/components/ui/Callout";
import NavTile from "@/components/ui/NavTile";
import SectionHeader from "@/components/ui/SectionHeader";
import { lastVerified } from "@/data/predeparture";

export const metadata: Metadata = { title: "Before you fly" };

/**
 * Public and offline-capable on purpose, like Emergency and the Guide:
 * pre-departure prep is safety content, and nobody should need an account
 * (or a connection, after the first visit) to read it.
 */
export default function PreparePage() {
  return (
    <main>
      <SectionHeader
        level={1}
        eyebrow="Prepare"
        tile={<NavTile feature="prepare" />}
        title="Before you fly"
        intro="Pre-departure checklist for a US → Italy trip. Tap items off as you go — progress is saved on this device."
      />

      {/* THE one caveat for the whole screen — per-section repeats deleted. */}
      <Callout className="mt-4">
        Last verified {lastVerified} —{" "}
        <strong className="font-bold">recheck entry rules close to departure.</strong>
      </Callout>

      <div className="mt-5">
        <PrepareChecklist />
      </div>
    </main>
  );
}
