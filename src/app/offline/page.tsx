import CallPlate from "@/components/ui/CallPlate";
import SectionHeader from "@/components/ui/SectionHeader";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main>
      <SectionHeader
        level={1}
        eyebrow="Offline"
        title="No connection — you're still covered"
        intro="This page wasn't cached yet, but calls don't need data. The core numbers are below; the Emergency and Guide screens work offline if you've opened them before."
      />
      <div className="mt-5 space-y-3">
        <CallPlate number="112" dial="112" name="All emergencies" nameIt="Numero Unico di Emergenza" tier="primary" />
        <CallPlate number="113" dial="113" name="State Police" nameIt="Polizia di Stato" />
        <CallPlate number="115" dial="115" name="Fire Brigade" nameIt="Vigili del Fuoco" />
        <CallPlate number="118" dial="118" name="Medical emergency" nameIt="Emergenza Sanitaria" />
      </div>
    </main>
  );
}
