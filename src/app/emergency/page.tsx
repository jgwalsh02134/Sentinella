import type { Metadata } from "next";
import { Car, Hospital, Map, Navigation } from "lucide-react";
import CallPlate from "@/components/ui/CallPlate";
import ActionRow from "@/components/ui/ActionRow";
import Callout from "@/components/ui/Callout";
import Card from "@/components/ui/Card";
import Disclosure from "@/components/ui/Disclosure";
import ListRow from "@/components/ui/ListRow";
import NavTile from "@/components/ui/NavTile";
import SectionHeader from "@/components/ui/SectionHeader";
import EmergencyJumpChips from "@/components/EmergencyJumpChips";
import Icon from "@/components/Icon";
import SealBadge from "@/components/SealBadge";
import ShareLocation from "@/components/ShareLocation";
import TelText from "@/components/TelText";
import WhereAreUCard from "@/components/WhereAreUCard";
import AustraliaFlag from "@/components/AustraliaFlag";
import IrelandFlag from "@/components/IrelandFlag";
import ItalyFlag from "@/components/ItalyFlag";
import NewZealandFlag from "@/components/NewZealandFlag";
import UkFlag from "@/components/UkFlag";
import UsFlag from "@/components/UsFlag";
import {
  callScript,
  emergencyNumbers,
  overseasCitizensServices,
  poisonCenters,
  roadsideAssistance,
  robbed,
  type LabeledLine,
} from "@/data/emergency";
import { consularHelp, embassies, lostDocumentSteps, type Embassy } from "@/data/embassies";
import {
  embassyDoctorsLink,
  erCostNote,
  romeEmergencyRooms,
  type EmergencyRoom,
} from "@/data/emergencyRooms";
import { policeStations, stationEmergencyNote } from "@/data/police";
import { safetyPois } from "@/data/safetyPois";
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
      {embassy.afterHours ? (
        <p className="mt-1 text-subhead text-secondary">
          <TelText text={embassy.afterHours} />
        </p>
      ) : null}
      {embassy.passports ? (
        <p className="mt-1 text-subhead">
          <a
            href={embassy.passports.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link"
          >
            {embassy.passports.note}
          </a>
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
            label: "Directions",
            href: appleMapsDirectionsUrl(`${embassy.address}, Italy`),
          },
          { label: "Website", href: embassy.website },
        ]}
      />
    </>
  );
}

/** Label + big mono number, the shared shape for multi-line phone cards. */
function LabeledLines({ lines }: { lines: readonly LabeledLine[] }) {
  return (
    <dl className="mt-3 space-y-3">
      {lines.map((line) => (
        <div key={line.dial}>
          <dt className="text-footnote text-secondary">{line.label}</dt>
          <dd className="mt-0.5 font-mono text-callout font-semibold tabular-nums">
            <a href={`tel:${line.dial}`} className="underline underline-offset-2">
              {line.number}
            </a>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** One ER card: name, the fact that changes who goes, address, actions.
 *  A Call action appears only for switchboards verified against an
 *  official source — never guessed. */
function ErCard({ er, headingLevel = 3 }: { er: EmergencyRoom; headingLevel?: 3 | 4 }) {
  const Heading = `h${headingLevel}` as "h3" | "h4";
  return (
    <Card as="article">
      <Heading className="text-headline">{er.name}</Heading>
      {er.note ? <p className="mt-0.5 text-subhead font-semibold">{er.note}</p> : null}
      <p className="mt-1 text-subhead text-secondary">{er.address}</p>
      {er.phone && er.dial ? (
        <p className="mt-1 font-mono text-callout font-semibold tabular-nums">
          <a href={`tel:${er.dial}`} className="underline underline-offset-2">
            {er.phone}
          </a>
        </p>
      ) : null}
      <ActionRow
        className="mt-3"
        actions={[
          ...(er.phone && er.dial ? [{ label: "Call", href: `tel:${er.dial}` }] : []),
          {
            label: "Directions",
            href: appleMapsDirectionsUrl(`${er.address}, Italy`),
          },
        ]}
      />
    </Card>
  );
}

export default function EmergencyPage() {
  const primary = emergencyNumbers.filter((n) => n.tier === "primary");
  const services = emergencyNumbers.filter((n) => n.tier === "service");
  const support = emergencyNumbers.filter((n) => n.tier === "support");
  // US posts promoted right after the numbers; Rome (the embassy) leads.
  const usRome = embassies.find((e) => e.country === "United States" && e.city === "Rome");
  const usFlorence = embassies.find((e) => e.country === "United States" && e.city === "Florence");
  const usEmbassies = [usRome, usFlorence].filter((e): e is Embassy => e != null);
  const otherEmbassies = embassies.filter((e) => e.country !== "United States");
  // Tuscany ERs come from the map's POI data — one source of truth.
  const tuscanyErs: EmergencyRoom[] = safetyPois
    .filter((p) => p.kind === "er" && (p.city === "Florence" || p.city === "Siena"))
    .map((p) => ({ name: p.name, address: p.address, phone: p.phone, dial: p.dial }));

  return (
    <main>
      <SectionHeader
        level={1}
        eyebrow="Emergency"
        tile={<NavTile feature="emergency" />}
        title="One tap to help"
        intro="Tap any plate to call. Core lines are free from any phone, even without a SIM."
      />

      {/* a. 112 hero + footnote + the call script one tap away. */}
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
        <Card padded={false} className="px-4 py-1">
          <Disclosure label="What to say when they answer">
            <ol className="space-y-2 pb-3 pt-1">
              {callScript.map((step, i) => (
                <li key={step.lead} className="body-copy flex gap-3">
                  <span className="font-mono font-bold text-secondary">{i + 1}</span>
                  <span className="min-w-0 text-secondary">
                    <strong className="font-bold text-primary">{step.lead}</strong> {step.rest}
                  </span>
                </li>
              ))}
            </ol>
          </Disclosure>
        </Card>
      </section>

      {/* b. Quick jumps — rendered client-side only. */}
      <EmergencyJumpChips className="mt-4" />

      {/* c. Direct service lines. */}
      <section id="numbers" className="mt-8 scroll-mt-4 space-y-3" aria-label="Emergency services">
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

      {/* d. U.S. citizens — promoted right after the numbers. */}
      <section id="us-citizens" className="mt-8 scroll-mt-4" aria-label="U.S. citizens">
        <SectionHeader
          title={
            <span className="flex items-center gap-2">
              <SealBadge /> U.S. citizens
            </span>
          }
        />
        <div className="mt-3 space-y-3">
          {usEmbassies.map((embassy) => (
            <Card key={embassy.name} as="article" className="break-words">
              <EmbassyBody embassy={embassy} headingLevel={3} />
            </Card>
          ))}

          <Card as="article">
            <h3 className="flex items-center gap-2 text-headline">
              <SealBadge /> {overseasCitizensServices.name}
            </h3>
            <p className="mt-0.5 text-subhead text-secondary">{overseasCitizensServices.summary}</p>
            <LabeledLines lines={overseasCitizensServices.lines} />
          </Card>

          <Card padded={false} className="px-4 py-2">
            <Disclosure label="What consular officers can and can't do">
              <div className="grid gap-4 pb-3 pt-1 sm:grid-cols-2">
                <div>
                  <h4 className="text-subhead font-bold">They can</h4>
                  <ul className="mt-1 space-y-1">
                    {consularHelp.can.map((item) => (
                      <li key={item} className="text-subhead text-secondary">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-subhead font-bold">They can&apos;t</h4>
                  <ul className="mt-1 space-y-1">
                    {consularHelp.cant.map((item) => (
                      <li key={item} className="text-subhead text-secondary">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Disclosure>
          </Card>

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

      {/* e. Support lines. */}
      <section id="support" className="mt-8 scroll-mt-4 space-y-3" aria-label="Support lines">
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

        <Card as="article">
          <h3 className="flex items-center gap-2 text-headline">
            <Icon icon={Car} size="md" /> {roadsideAssistance.name}
          </h3>
          <p className="mt-0.5 text-subhead text-secondary">
            {roadsideAssistance.nameIt} · {roadsideAssistance.summary}
          </p>
          <LabeledLines lines={roadsideAssistance.lines} />
          <p className="mt-2 text-footnote text-secondary">
            If the +39 form won&apos;t connect from your phone, dial{" "}
            <a
              href={`tel:${roadsideAssistance.fallback.dial}`}
              className="font-semibold tabular-nums underline underline-offset-2"
            >
              {roadsideAssistance.fallback.number}
            </a>
            .
          </p>
          <p className="mt-2 text-footnote text-secondary">{roadsideAssistance.footnote}</p>
        </Card>

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
                  label: "Directions",
                  href: appleMapsDirectionsUrl(
                    `${p.hospital.replace(/\s*\([^)]*\)/g, "")}, ${p.city}, Italy`,
                  ),
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

      {/* f. Emergency rooms. */}
      <section id="hospitals" className="mt-8 scroll-mt-4" aria-label="Emergency rooms">
        <SectionHeader
          title={
            <span className="flex items-center gap-2">
              <Icon icon={Hospital} size="md" /> Emergency rooms — Rome
            </span>
          }
        />
        <div className="mt-3 space-y-3">
          {romeEmergencyRooms.map((er) => (
            <ErCard key={er.name} er={er} />
          ))}
        </div>

        <SectionHeader
          className="mt-6"
          level={3}
          title={
            <span className="flex items-center gap-2">
              <Icon icon={Hospital} size="md" /> Emergency rooms — Tuscany
            </span>
          }
        />
        <div className="mt-3 space-y-3">
          {tuscanyErs.map((er) => (
            <ErCard key={er.name} er={er} headingLevel={4} />
          ))}
        </div>

        <p className="body-copy mt-4 text-secondary">{erCostNote}</p>
        <p className="mt-2 text-subhead">
          <a
            href={embassyDoctorsLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link"
          >
            {embassyDoctorsLink.label} →
          </a>{" "}
          <span className="text-secondary">({embassyDoctorsLink.note})</span>
        </p>
        <Callout className="mt-3">
          Hospital switchboards verified July 2026 —{" "}
          <strong className="font-bold">
            verify against official sources before relying on them.
          </strong>{" "}
          In a true emergency call 112 first.
        </Callout>
      </section>

      {/* g. Tools. */}
      <section id="tools" className="mt-8 scroll-mt-4 space-y-3" aria-label="Tools">
        <SectionHeader title="Tools" />
        <ShareLocation />
        <ListRow
          href="/map"
          icon={<Icon icon={Map} size="lg" />}
          title="Offline map"
          subtitle="Your position on a downloaded map — no connection needed"
        />
        <WhereAreUCard headingLevel={3} />
      </section>

      {/* h. If you're robbed + lost passport. */}
      <section id="robbed" className="mt-8 scroll-mt-4" aria-label="If you're robbed">
        <SectionHeader
          title={
            <span className="flex items-center gap-2">
              <ItalyFlag /> If you&apos;re robbed
            </span>
          }
          intro={robbed.summary}
        />
        <Card className="mt-3">
          <ol className="space-y-3">
            {robbed.steps.map((step, i) => (
              <li key={step.lead} className="body-copy flex gap-3">
                <span className="font-mono font-bold text-secondary">{i + 1}</span>
                <span className="min-w-0 text-secondary">
                  <strong className="font-bold text-primary">{step.lead}</strong>{" "}
                  <TelText text={step.rest} />
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-3 border-t border-default pt-3 text-subhead">
            Passport taken?{" "}
            <a href="#lost-passport" className="text-link">
              Continue below
            </a>
            .
          </p>
        </Card>
        {/* Same typed data the map markers use — one source of truth. */}
        <Card className="mt-3">
          <Disclosure
            label="Where to file — stations in Rome, Florence &amp; Siena"
            sublabel={stationEmergencyNote}
          >
            <ul className="mt-2">
              {policeStations.map((station, i) => (
                <li
                  key={station.id}
                  className={`py-3 ${i > 0 ? "border-t border-default" : ""}`}
                >
                  <p className="text-callout font-bold">
                    {station.name}{" "}
                    <span className="font-normal text-secondary">· {station.city}</span>
                  </p>
                  <p className="mt-0.5 text-footnote text-secondary">{station.address}</p>
                  {station.notes ? (
                    <p className="mt-0.5 text-footnote text-secondary">{station.notes}</p>
                  ) : null}
                  <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-subhead">
                    {station.dial ? (
                      <a
                        href={`tel:${station.dial}`}
                        className="inline-flex min-h-control items-center font-mono font-semibold tabular-nums underline underline-offset-2"
                      >
                        {station.phone}
                      </a>
                    ) : null}
                    <a
                      href={appleMapsDirectionsUrl(`${station.address}, Italy`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-control items-center gap-1.5 text-link"
                    >
                      <Icon icon={Navigation} size="sm" /> Directions
                    </a>
                  </p>
                </li>
              ))}
            </ul>
            <p className="text-footnote text-secondary">
              Directions need a connection; calls work on the phone network. Station contacts
              verified July 2026 — verify before relying on them.
            </p>
          </Disclosure>
        </Card>
        <Callout className="mt-3">{robbed.tip}</Callout>
      </section>

      <section id="lost-passport" className="mt-8 scroll-mt-4" aria-label="Lost documents">
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
