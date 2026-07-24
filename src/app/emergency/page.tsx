import type { Metadata } from "next";
import { Car, Hospital, Map, Smartphone } from "lucide-react";
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
import StateDeptWhatsAppCard from "@/components/StateDeptWhatsAppCard";
import ShareLocation from "@/components/ShareLocation";
import TelText from "@/components/TelText";
import AustraliaFlag from "@/components/AustraliaFlag";
import CanadaFlag from "@/components/CanadaFlag";
import IrelandFlag from "@/components/IrelandFlag";
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
  type Step,
} from "@/data/emergency";
import { consularHelp, embassies, type Embassy } from "@/data/embassies";
import { romeEmergencyRooms, type EmergencyRoom } from "@/data/emergencyRooms";
import { safetyPois } from "@/data/safetyPois";
import { appleMapsDirectionsUrl } from "@/lib/maps";

/** Every post uses the app's flag icon system — no emoji fallback. On this
 *  page flags are MEANINGFUL, so each carries alt text via `label`. */
const flagIcons: Record<string, (props: { className?: string; label?: string }) => JSX.Element> = {
  "United States": UsFlag,
  "United Kingdom": UkFlag,
  Canada: CanadaFlag,
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
        {FlagIcon ? <FlagIcon label={`${embassy.country} flag`} /> : null} {embassy.name}
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
            label: "Directions",
            href: appleMapsDirectionsUrl(`${embassy.address}, Italy`),
          },
          { label: "Website", href: embassy.website },
        ]}
      />
    </>
  );
}

/** THE one numbering mechanism on this page: native ol markers, styled —
 *  never a manual digit span next to a list item (that reads as double
 *  numbering to assistive tech). */
function NumberedSteps({ steps }: { steps: readonly Step[] }) {
  return (
    // No marker:font-mono: a font-family swap inside ::marker drops the
    // digits in some engines — weight and color only.
    <ol className="list-decimal space-y-2 pl-5 marker:font-semibold marker:text-secondary">
      {steps.map((step) => (
        <li key={step.lead} className="body-copy pl-1 text-secondary">
          <strong className="font-bold text-primary">{step.lead}</strong>{" "}
          <TelText text={step.rest} />
        </li>
      ))}
    </ol>
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
  // US posts promoted right after the numbers; Florence (this trip's
  // consulate) leads, the Rome embassy follows.
  const usRome = embassies.find((e) => e.country === "United States" && e.city === "Rome");
  const usFlorence = embassies.find((e) => e.country === "United States" && e.city === "Florence");
  const usEmbassies = [usFlorence, usRome].filter((e): e is Embassy => e != null);
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
        intro="Tap any plate to call."
      />

      {/* a. 112 hero: PURE SIGNAGE + one footnote line + the script one tap away. */}
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
            <div className="pb-3 pt-1">
              <NumberedSteps steps={callScript} />
            </div>
          </Disclosure>
        </Card>
      </section>

      {/* b. Quick jumps — rendered client-side only. */}
      <EmergencyJumpChips className="mt-4" />

      {/* c. Every number, compact — within ~2 screens of the top. */}
      <section id="numbers" className="mt-8 scroll-mt-4 space-y-3" aria-label="Numbers">
        <SectionHeader title="Numbers" />
        {[...services, ...support].map((n) => (
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
            <i lang="it">{roadsideAssistance.nameIt}</i> · {roadsideAssistance.summary}
          </p>
          <LabeledLines lines={roadsideAssistance.lines} />
        </Card>
      </section>

      {/* d. U.S. help — promoted right after the numbers. */}
      <section id="us-help" className="mt-8 scroll-mt-4" aria-label="U.S. help">
        <SectionHeader
          title={
            <span className="flex items-center gap-2">
              <SealBadge /> U.S. help
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

          <StateDeptWhatsAppCard variant="compact" />

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
            <Disclosure label="Other embassies" sublabel="UK, Canada, Australia, Ireland, NZ">
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
      </section>

      {/* e. Medical: poison control + emergency rooms, one card pattern. */}
      <section id="medical" className="mt-8 scroll-mt-4 space-y-3" aria-label="Medical">
        <SectionHeader title="Medical" />
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
        <SectionHeader
          className="mt-6"
          level={3}
          title={
            <span className="flex items-center gap-2">
              <Icon icon={Hospital} size="md" /> Emergency rooms — Rome
            </span>
          }
        />
        <div className="mt-3 space-y-3">
          {romeEmergencyRooms.map((er) => (
            <ErCard key={er.name} er={er} headingLevel={4} />
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
      </section>

      {/* f. If it goes wrong — ONE merged sequence, no duplicated steps. */}
      <section id="robbed" className="mt-8 scroll-mt-4" aria-label="If it goes wrong">
        <SectionHeader title={robbed.title} />
        <Card className="mt-3">
          <NumberedSteps steps={robbed.steps} />
        </Card>
      </section>

      {/* g. Tools — last on purpose: reference, not rescue. */}
      <section id="tools" className="mt-8 scroll-mt-4 space-y-3" aria-label="Tools">
        <SectionHeader title="Tools" />
        <ShareLocation />
        <ListRow
          href="/map"
          icon={<Icon icon={Map} size="lg" />}
          title="Offline map"
          subtitle="Your position on a downloaded map — no connection needed"
        />
        {/* One row only — the full app card lives in the Guide (single
            source of truth). */}
        <ListRow
          href="/guide/basics#where-are-u"
          icon={<Icon icon={Smartphone} size="lg" />}
          title="112 Where ARE U"
          subtitle="Official 112 app — sends GPS"
        />
        {/* THE one verification caveat for all hardcoded numbers on this page. */}
        <Callout>
          Numbers and medical contacts verified July 2026 —{" "}
          <strong className="font-bold">
            verify against official sources before relying on them.
          </strong>
        </Callout>
      </section>
    </main>
  );
}
