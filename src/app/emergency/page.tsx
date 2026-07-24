import type { Metadata } from "next";
import { Map } from "lucide-react";
import CallPlate from "@/components/ui/CallPlate";
import ActionRow from "@/components/ui/ActionRow";
import Callout from "@/components/ui/Callout";
import Card from "@/components/ui/Card";
import Disclosure from "@/components/ui/Disclosure";
import ListRow from "@/components/ui/ListRow";
import NavTile from "@/components/ui/NavTile";
import SectionHeader from "@/components/ui/SectionHeader";
import BrandIcon from "@/components/BrandIcon";
import Icon from "@/components/Icon";
import ShareLocation from "@/components/ShareLocation";
import TelText from "@/components/TelText";
import WhereAreUCard from "@/components/WhereAreUCard";
import AustraliaFlag from "@/components/AustraliaFlag";
import IrelandFlag from "@/components/IrelandFlag";
import NewZealandFlag from "@/components/NewZealandFlag";
import UkFlag from "@/components/UkFlag";
import UsFlag from "@/components/UsFlag";
import { callScript, emergencyNumbers, poisonCenters } from "@/data/emergency";
import { embassies, lostDocumentSteps, type Embassy } from "@/data/embassies";
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

/** One embassy entry — used both as a full card and as a row inside the
 *  "Other embassies" disclosure. Actions keep their names everywhere. */
function EmbassyBody({ embassy, headingLevel }: { embassy: Embassy; headingLevel: 3 | 4 }) {
  const FlagIcon = flagIcons[embassy.country];
  const Heading = `h${headingLevel}` as "h3" | "h4";
  return (
    <>
      <Heading className="text-headline">
        {FlagIcon ? <FlagIcon /> : <span aria-hidden="true">{embassy.flag}</span>} {embassy.name}
      </Heading>
      <p className="mt-1 text-subhead text-secondary">{embassy.address}</p>
      <p className="mt-1 font-mono text-callout font-semibold tabular-nums">
        <a href={`tel:${embassy.dial}`} className="underline underline-offset-2">
          {embassy.phone}
        </a>
      </p>
      {embassy.notes ? (
        <p className="mt-1 text-subhead text-secondary">
          <TelText text={embassy.notes} />
        </p>
      ) : null}
      {embassy.email ? (
        <p className="mt-1 text-subhead text-secondary">
          Email:{" "}
          <a href={`mailto:${embassy.email}`} className="text-link break-all">
            {embassy.email}
          </a>
        </p>
      ) : null}
      <ActionRow
        className="mt-3"
        actions={[
          { label: "Call", href: `tel:${embassy.dial}` },
          {
            label: "Get directions",
            href: appleMapsDirectionsUrl(`${embassy.address}, Italy`),
            // Brand mark: the destination is Apple Maps.
            icon: <BrandIcon brand="apple" size={16} />,
          },
          { label: "Website", href: embassy.website },
        ]}
      />
    </>
  );
}

export default function EmergencyPage() {
  const primary = emergencyNumbers.filter((n) => n.tier === "primary");
  const services = emergencyNumbers.filter((n) => n.tier === "service");
  const support = emergencyNumbers.filter((n) => n.tier === "support");
  // The two US posts render first as full cards; the rest collapse.
  const usEmbassies = embassies.filter((e) => e.country === "United States");
  const otherEmbassies = embassies.filter((e) => e.country !== "United States");

  return (
    <main>
      <SectionHeader
        level={1}
        eyebrow="Emergency"
        tile={<NavTile feature="emergency" />}
        title="One tap to help"
        intro="Tap any plate to call. Core lines are free from any phone, even without a SIM."
      />

      <section className="mt-5 space-y-3" aria-label="Primary emergency number">
        {primary.map((n) => (
          <CallPlate
            key={n.dial}
            number={n.number}
            dial={n.dial}
            name={n.name}
            nameIt={n.nameIt}
            tier={n.tier}
            footnote={n.detail}
          />
        ))}
        <Card>
          <h2 className="text-headline">When the operator answers</h2>
          <ol className="mt-2 space-y-2">
            {callScript.map((step, i) => (
              <li key={step.lead} className="body-copy flex gap-3">
                <span className="font-mono font-bold text-secondary">{i + 1}</span>
                <span className="min-w-0 text-secondary">
                  <strong className="font-bold text-primary">{step.lead}</strong> {step.rest}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      <section className="mt-8 space-y-3" aria-label="Share your position">
        <ShareLocation />
        <ListRow
          href="/map"
          icon={<Icon icon={Map} size="lg" />}
          title="Offline map"
          subtitle="Your position on a downloaded map — no connection needed"
        />
      </section>

      <section className="mt-8" aria-label="112 companion app">
        <WhereAreUCard />
      </section>

      <section className="mt-8 space-y-3" aria-label="Emergency services">
        <SectionHeader title="Direct service lines" />
        {services.map((n) => (
          <CallPlate
            key={n.dial}
            number={n.number}
            dial={n.dial}
            name={n.name}
            nameIt={n.nameIt}
            tier={n.tier}
            footnote={n.detail}
          />
        ))}
      </section>

      <section className="mt-8 space-y-3" aria-label="Support lines">
        <SectionHeader title="Support lines" />
        {support.map((n) => (
          <CallPlate
            key={n.dial}
            number={n.number}
            dial={n.dial}
            name={n.name}
            nameIt={n.nameIt}
            tier={n.tier}
            footnote={n.detail}
          />
        ))}
        {poisonCenters.map((p) => (
          <Card key={p.dial} as="article">
            <h3 className="text-headline">Poison control — {p.city}</h3>
            <p className="mt-1 text-subhead text-secondary">{p.hospital}</p>
            <p className="mt-1 font-mono text-callout font-semibold tabular-nums">
              <a href={`tel:${p.dial}`} className="underline underline-offset-2">
                {p.phone}
              </a>
            </p>
            <ActionRow
              className="mt-3"
              actions={[
                { label: "Call", href: `tel:${p.dial}` },
                {
                  label: "Get directions",
                  href: appleMapsDirectionsUrl(
                    `${p.hospital.replace(/\s*\([^)]*\)/g, "")}, ${p.city}, Italy`,
                  ),
                  icon: <BrandIcon brand="apple" size={16} />,
                },
              ]}
            />
          </Card>
        ))}
        <Callout>
          Support and poison-control numbers verified July 2026 —{" "}
          <strong className="font-bold">
            verify against official sources before relying on them.
          </strong>
        </Callout>
      </section>

      <section className="mt-8" aria-label="Embassies and consulates">
        <SectionHeader title="Embassies & consulates" />
        <div className="mt-3 space-y-3">
          {usEmbassies.map((embassy) => (
            <Card key={embassy.name} as="article" className="break-words">
              <EmbassyBody embassy={embassy} headingLevel={3} />
            </Card>
          ))}
          <Card padded={false} className="px-4 py-2">
            <Disclosure
              label="Other embassies"
              sublabel="UK, Canada, Australia, Ireland, New Zealand"
            >
              <div className="break-words pb-2">
                {otherEmbassies.map((embassy) => (
                  <div key={embassy.name} className="border-t border-default pb-1 pt-3">
                    <EmbassyBody embassy={embassy} headingLevel={4} />
                  </div>
                ))}
              </div>
            </Disclosure>
          </Card>
        </div>
        <Callout className="mt-3">
          Switchboard numbers verified July 2026. After-hours consular emergency lines differ —{" "}
          <strong className="font-bold">verify yours on the official site before travel.</strong>
        </Callout>
      </section>

      <section className="mt-8" aria-label="Lost documents">
        <SectionHeader title="Passport lost or stolen" />
        <Card className="mt-3">
          <ol className="space-y-3">
            {lostDocumentSteps.map((step, i) => (
              <li key={step.lead} className="body-copy flex gap-3">
                <span className="font-mono font-bold text-secondary">{i + 1}</span>
                <span className="min-w-0 text-secondary">
                  <strong className="font-bold text-primary">{step.lead}</strong>{" "}
                  <TelText text={step.rest} />
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </section>
    </main>
  );
}
