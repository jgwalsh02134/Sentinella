import type { Metadata } from "next";
import Link from "next/link";
import CallPlate from "@/components/CallPlate";
import ShareLocation from "@/components/ShareLocation";
import AustraliaFlag from "@/components/AustraliaFlag";
import IrelandFlag from "@/components/IrelandFlag";
import NewZealandFlag from "@/components/NewZealandFlag";
import UkFlag from "@/components/UkFlag";
import UsFlag from "@/components/UsFlag";
import { callScript, emergencyNumbers, poisonCenters, whereAreUApp } from "@/data/emergency";
import { embassies, lostDocumentSteps } from "@/data/embassies";
import { appleMapsDirectionsUrl } from "@/lib/maps";

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
        <h1 className="title-page">One tap to help</h1>
        <p className="body-copy mt-1 text-secondary">
          Every plate below is a phone number. All core lines are free and work from any phone, with
          or without a local SIM.
        </p>
      </header>

      <section className="mt-5 space-y-3" aria-label="Primary emergency number">
        {primary.map((n) => (
          <div key={n.dial}>
            <CallPlate number={n.number} dial={n.dial} name={n.name} nameIt={n.nameIt} tier={n.tier} />
            <p className="mt-1.5 px-1 text-footnote text-secondary">{n.detail}</p>
          </div>
        ))}
        <div className="plate border border-default bg-card p-5">
          <h2 className="text-headline">When the operator answers</h2>
          <ol className="mt-2 space-y-2">
            {callScript.map((step, i) => (
              <li key={step.lead} className="body-copy flex gap-3">
                <span className="font-mono font-bold text-verde">{i + 1}</span>
                <span className="min-w-0 text-secondary">
                  <strong className="font-bold text-primary">{step.lead}</strong> {step.rest}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mt-6" aria-label="Share your position">
        <ShareLocation />
        <Link href="/map" className="plate mt-3 block border border-default bg-card p-4">
          <p className="text-headline">Offline map →</p>
          <p className="mt-0.5 text-subhead text-secondary">
            See where you are on a downloaded city map — works without a connection.
          </p>
        </Link>
      </section>

      <section className="mt-6" aria-label="112 companion app">
        <div className="plate border border-default bg-card p-5">
          <h2 className="text-headline">{whereAreUApp.title}</h2>
          <p className="body-copy mt-1.5 text-secondary">{whereAreUApp.body}</p>
          <ul className="mt-2 space-y-1.5">
            {whereAreUApp.bullets.map((b) => (
              <li key={b} className="body-copy text-secondary">
                {b}
              </li>
            ))}
          </ul>
          <a
            href={whereAreUApp.link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex min-h-[2.75rem] items-center justify-center rounded-xl border-2 border-verde px-4 text-callout font-bold text-verde active:bg-verde-tint"
          >
            {whereAreUApp.link.label}
          </a>
          <p className="mt-2 text-footnote text-secondary">{whereAreUApp.note}</p>
        </div>
      </section>

      <section className="mt-8 space-y-3" aria-label="Emergency services">
        <h2 className="title-section">Direct service lines</h2>
        {services.map((n) => (
          <div key={n.dial}>
            <CallPlate number={n.number} dial={n.dial} name={n.name} nameIt={n.nameIt} tier={n.tier} />
            <p className="mt-1.5 px-1 text-footnote text-secondary">{n.detail}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 space-y-3" aria-label="Support lines">
        <h2 className="title-section">Support lines</h2>
        {support.map((n) => (
          <div key={n.dial}>
            <CallPlate number={n.number} dial={n.dial} name={n.name} nameIt={n.nameIt} tier={n.tier} />
            <p className="mt-1.5 px-1 text-footnote text-secondary">{n.detail}</p>
          </div>
        ))}
        {poisonCenters.map((p) => (
          <div key={p.dial} className="space-y-2">
            <CallPlate
              number={p.phone.replace("+39 ", "")}
              dial={p.dial}
              name={`Poison control — ${p.city}`}
              nameIt={p.hospital}
              tier="support"
            />
            <a
              href={appleMapsDirectionsUrl(`${p.hospital.replace(/\s*\([^)]*\)/g, "")}, ${p.city}, Italy`)}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-[2.75rem] items-center justify-center rounded-xl border-2 border-verde text-callout font-bold text-verde active:bg-verde-tint"
            >
              Directions — {p.hospital}
            </a>
          </div>
        ))}
        <p className="callout">
          Support and poison-control numbers verified July 2026 —{" "}
          <strong className="font-bold">verify against official sources before relying on them.</strong>
        </p>
      </section>

      <section className="mt-8" aria-label="Embassies and consulates">
        <h2 className="title-section">Embassies & consulates</h2>
        <p className="callout mt-2">
          Switchboard numbers only, verified July 2026. After-hours consular emergency lines differ —{" "}
          <strong className="font-bold">verify yours on the official site before travel.</strong>
        </p>
        <div className="mt-3 space-y-3">
          {embassies.map((e) => {
            const FlagIcon = flagIcons[e.country];
            return (
            <div key={e.name} className="plate break-words border border-default bg-card p-4">
              <h3 className="text-headline">
                {FlagIcon ? <FlagIcon /> : <span aria-hidden="true">{e.flag}</span>}{" "}
                {e.name}
              </h3>
              <p className="mt-0.5 text-subhead text-secondary">{e.address}</p>
              <p className="mt-0.5 font-mono text-callout font-semibold tabular-nums">{e.phone}</p>
              {e.notes ? <p className="mt-1 text-subhead text-secondary">{e.notes}</p> : null}
              {e.email ? (
                <p className="mt-1 text-subhead text-secondary">
                  Email:{" "}
                  <a href={`mailto:${e.email}`} className="text-link break-all">
                    {e.email}
                  </a>
                </p>
              ) : null}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <a
                  href={`tel:${e.dial}`}
                  className="flex min-h-[2.75rem] items-center justify-center rounded-xl bg-verde text-callout font-bold text-white active:bg-verde-deep"
                >
                  Call
                </a>
                <a
                  href={appleMapsDirectionsUrl(`${e.address}, Italy`)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-[2.75rem] items-center justify-center rounded-xl border-2 border-verde text-callout font-bold text-verde active:bg-verde-tint"
                >
                  Directions
                </a>
                <a
                  href={e.website}
                  target="_blank"
                  rel="noreferrer"
                  className="col-span-2 flex min-h-[2.75rem] items-center justify-center rounded-xl border-2 border-verde text-callout font-bold text-verde active:bg-verde-tint"
                >
                  Website
                </a>
              </div>
            </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8" aria-label="Lost documents">
        <h2 className="title-section">Passport lost or stolen</h2>
        <div className="plate mt-2 border border-default bg-card p-5">
          <ol className="space-y-2.5">
            {lostDocumentSteps.map((step, i) => (
              <li key={step.lead} className="body-copy flex gap-3">
                <span className="font-mono font-bold text-verde">{i + 1}</span>
                <span className="min-w-0 text-secondary">
                  <strong className="font-bold text-primary">{step.lead}</strong> {step.rest}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
