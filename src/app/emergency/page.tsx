import type { Metadata } from "next";
import CallPlate from "@/components/CallPlate";
import ShareLocation from "@/components/ShareLocation";
import AustraliaFlag from "@/components/AustraliaFlag";
import IrelandFlag from "@/components/IrelandFlag";
import NewZealandFlag from "@/components/NewZealandFlag";
import UkFlag from "@/components/UkFlag";
import UsFlag from "@/components/UsFlag";
import { callScript, emergencyNumbers, poisonCenters } from "@/data/emergency";
import { embassies, lostDocumentSteps } from "@/data/embassies";

/** Countries with SVG flag icons; the rest fall back to their emoji flag. */
const flagIcons: Record<string, (props: { className?: string }) => JSX.Element> = {
  "United States": UsFlag,
  "United Kingdom": UkFlag,
  Ireland: IrelandFlag,
  Australia: AustraliaFlag,
  "New Zealand": NewZealandFlag,
};

export const metadata: Metadata = { title: "Emergency" };

export default function EmergencyPage() {
  const primary = emergencyNumbers.filter((n) => n.tier === "primary");
  const services = emergencyNumbers.filter((n) => n.tier === "service");
  const support = emergencyNumbers.filter((n) => n.tier === "support");

  return (
    <main>
      <header>
        <p className="eyebrow">Emergency</p>
        <h1 className="text-2xl font-extrabold tracking-tight">One tap to help</h1>
        <p className="mt-1 text-sm leading-relaxed text-mist">
          Every plate below is a phone number. All core lines are free and work from any phone, with
          or without a local SIM.
        </p>
      </header>

      <section className="mt-5 space-y-3" aria-label="Primary emergency number">
        {primary.map((n) => (
          <CallPlate key={n.dial} {...n} />
        ))}
        <div className="plate border border-line bg-white p-5">
          <p className="eyebrow">When the operator answers</p>
          <ol className="mt-2 space-y-2">
            {callScript.map((line, i) => (
              <li key={line} className="flex gap-3 text-sm leading-relaxed">
                <span className="font-mono font-bold text-verde">{i + 1}</span>
                <span className="text-mist">{line}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mt-6" aria-label="Share your position">
        <ShareLocation />
      </section>

      <section className="mt-6 space-y-3" aria-label="Emergency services">
        <p className="eyebrow">Direct service lines</p>
        {services.map((n) => (
          <CallPlate key={n.dial} {...n} />
        ))}
      </section>

      <section className="mt-6 space-y-3" aria-label="Support lines">
        <p className="eyebrow">Support lines</p>
        {support.map((n) => (
          <CallPlate key={n.dial} {...n} />
        ))}
        {poisonCenters.map((p) => (
          <CallPlate
            key={p.dial}
            number={p.phone.replace("+39 ", "")}
            dial={p.dial}
            name={`Poison control — ${p.city}`}
            nameIt={p.hospital}
            tier="support"
          />
        ))}
      </section>

      <section className="mt-6" aria-label="Embassies">
        <p className="eyebrow">Embassies in Rome</p>
        <p className="mt-1 text-xs leading-relaxed text-mist">
          Switchboard numbers. After-hours consular emergency lines differ — verify yours on the
          official site before travel.
        </p>
        <div className="mt-3 space-y-3">
          {embassies.map((e) => {
            const FlagIcon = flagIcons[e.country];
            return (
            <div key={e.country} className="plate border border-line bg-white p-4">
              <p className="text-base font-bold">
                {FlagIcon ? <FlagIcon /> : <span aria-hidden="true">{e.flag}</span>}{" "}
                {e.name}
              </p>
              <p className="mt-0.5 text-sm text-mist">{e.address}</p>
              {e.notes ? <p className="mt-1 text-xs leading-relaxed text-mist">{e.notes}</p> : null}
              <div className="mt-3 flex gap-3">
                <a
                  href={`tel:${e.dial}`}
                  className="min-h-[2.75rem] flex-1 rounded-xl bg-verde text-center text-sm font-bold leading-[2.75rem] text-white active:bg-verde-deep"
                >
                  {e.phone}
                </a>
                <a
                  href={e.website}
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-[2.75rem] flex-1 rounded-xl border-2 border-verde text-center text-sm font-bold leading-[2.6rem] text-verde active:bg-verde-tint"
                >
                  Website
                </a>
              </div>
            </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6" aria-label="Lost documents">
        <p className="eyebrow">Passport lost or stolen</p>
        <div className="plate mt-2 border border-line bg-white p-5">
          <ol className="space-y-2.5">
            {lostDocumentSteps.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm leading-relaxed">
                <span className="font-mono font-bold text-verde">{i + 1}</span>
                <span className="text-mist">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
