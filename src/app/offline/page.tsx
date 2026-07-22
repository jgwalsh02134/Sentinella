import CallPlate from "@/components/CallPlate";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main>
      <header>
        <p className="eyebrow">Offline</p>
        <h1 className="text-2xl font-extrabold tracking-tight">No connection — you're still covered</h1>
        <p className="mt-1 text-sm leading-relaxed text-mist">
          This page wasn't cached yet, but calls don't need data. The core numbers are below; the
          Emergency and Guide screens work offline if you've opened them before.
        </p>
      </header>
      <div className="mt-5 space-y-3">
        <CallPlate number="112" dial="112" name="All emergencies" nameIt="Numero Unico di Emergenza" tier="primary" />
        <CallPlate number="113" dial="113" name="State Police" nameIt="Polizia di Stato" />
        <CallPlate number="115" dial="115" name="Fire Brigade" nameIt="Vigili del Fuoco" />
        <CallPlate number="118" dial="118" name="Medical emergency" nameIt="Emergenza Sanitaria" />
      </div>
    </main>
  );
}
