import type { Metadata } from "next";
import PrepareChecklist from "@/components/PrepareChecklist";
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
      <header>
        <p className="eyebrow">Prepare</p>
        <h1 className="title-page">Before you fly</h1>
        <p className="body-copy mt-1 text-secondary">
          Pre-departure checklist for a US → Italy trip. Tap items off as you go — progress is saved
          on this device.
        </p>
      </header>

      <p className="mt-4 rounded-xl bg-ambra-tint p-3 text-sm font-semibold text-ambra">
        Last verified: {lastVerified}. Entry rules and health guidance shift — recheck anything
        critical close to departure.
      </p>

      <div className="mt-5">
        <PrepareChecklist />
      </div>
    </main>
  );
}
