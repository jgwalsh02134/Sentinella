"use client";

import { Fragment, useEffect, useState } from "react";
import BrandIcon from "@/components/BrandIcon";
import ItalyFlag from "@/components/ItalyFlag";
import SeasonalWeatherCard from "@/components/SeasonalWeatherCard";
import TelText from "@/components/TelText";
import WhereAreUCard from "@/components/WhereAreUCard";
import Callout from "@/components/ui/Callout";
import Card from "@/components/ui/Card";
import SectionHeader from "@/components/ui/SectionHeader";
import { scams } from "@/data/scams";
import { phraseGroups } from "@/data/phrases";
import { regions } from "@/data/regions";
import { healthItems, basicsItems, type InfoItem } from "@/data/health";

const tabs = ["Basics", "Scams", "Phrases", "Cities", "Health"] as const;
type Tab = (typeof tabs)[number];

/** Visible section heading paired with the eyebrow micro-label per tab. */
const tabHeadings: Record<Tab, string> = {
  Basics: "Situational basics",
  Scams: "The scams that actually run",
  Phrases: "Emergency Italian",
  Cities: "City briefings",
  Health: "How healthcare works",
};

/**
 * Category liveries via the accent slot — the label always accompanies the
 * color, so hue is never the only signal. Content text stays neutral.
 */
const tabAccents: Record<Tab, string> = {
  Basics: "oliva",
  Scams: "terracotta",
  Phrases: "glicine",
  Cities: "azzurro",
  Health: "verde",
};

/** Tab ↔ URL hash, so tabs deep-link and survive reload. */
const tabHash: Record<Tab, string> = {
  Basics: "basics",
  Scams: "scams",
  Phrases: "phrases",
  Cities: "cities",
  Health: "health",
};

function tabFromHash(hash: string): Tab | null {
  const clean = hash.replace(/^#/, "").toLowerCase();
  return tabs.find((t) => tabHash[t] === clean) ?? null;
}

/**
 * Split off the first sentence so an item's lead can render bold and the
 * key fact scans in two seconds. Avoids false breaks after abbreviations
 * ("U.S. STEP") by requiring a lowercase letter, digit, or closing
 * punctuation before the period. Returns null for single-sentence bodies —
 * if everything is bold, nothing is.
 */
function splitFirstSentence(text: string): [string, string] | null {
  for (let i = 1; i < text.length - 2; i++) {
    if (text[i] === "." && text[i + 1] === " " && /[a-z0-9)'"’”]/.test(text[i - 1])) {
      return [text.slice(0, i + 1), text.slice(i + 2)];
    }
  }
  return null;
}

/** Body copy with a bold first-sentence lead. Phone numbers become tel: links. */
function LeadBody({ text }: { text: string }) {
  const split = splitFirstSentence(text);
  if (!split) return <TelText text={text} />;
  return (
    <>
      <strong className="font-bold text-primary">
        <TelText text={split[0]} />
      </strong>{" "}
      <TelText text={split[1]} />
    </>
  );
}

/** City-briefing bullets: bold the place/topic before a leading colon. */
function ColonLead({ text }: { text: string }) {
  const idx = text.indexOf(":");
  if (idx === -1 || idx > 40) return <TelText text={text} />;
  return (
    <>
      <strong className="font-bold text-primary">
        <TelText text={text.slice(0, idx + 1)} />
      </strong>
      <TelText text={text.slice(idx + 1)} />
    </>
  );
}

/** Official external resources render as links, not as fake buttons —
 *  buttons are for actions; these open reading material in the browser.
 *  Brand mark only when the brand is the destination: Apple Maps
 *  directions links get the Apple glyph; everything else stays generic. */
function ResourceLinks({ links }: { links: { label: string; url: string }[] }) {
  return (
    <p className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
      {links.map((link) => {
        const external = !link.url.startsWith("/");
        const appleMaps = link.url.startsWith("https://maps.apple.com");
        return (
          <a
            key={link.url}
            href={link.url}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            className="text-link inline-flex items-center gap-1 py-1 text-callout"
          >
            {appleMaps ? <BrandIcon brand="apple" size={16} /> : null}
            {link.label}
          </a>
        );
      })}
    </p>
  );
}

/** Basics and Health share one card layout. */
function InfoCard({ item }: { item: InfoItem }) {
  return (
    <Card as="article" accentEdge>
      <h3 className="text-headline">{item.title}</h3>
      <p className="body-copy mt-2 text-secondary">
        <LeadBody text={item.body} />
      </p>
      {item.bullets?.length ? (
        <ul className="mt-2 space-y-2">
          {item.bullets.map((b) => (
            <li key={b} className="body-copy text-secondary">
              <ColonLead text={b} />
            </li>
          ))}
        </ul>
      ) : null}
      {item.warning ? (
        <Callout className="mt-3">
          <TelText text={item.warning} />
        </Callout>
      ) : null}
      {item.links?.length ? <ResourceLinks links={item.links} /> : null}
    </Card>
  );
}

export default function GuideTabs() {
  const [tab, setTab] = useState<Tab>("Basics");

  // Deep-linking: #scams opens the Scams tab, and the current tab is
  // always reflected in the hash so reload and share keep the place.
  useEffect(() => {
    const initial = tabFromHash(window.location.hash);
    if (initial) setTab(initial);
    const onHashChange = () => {
      const next = tabFromHash(window.location.hash);
      if (next) setTab(next);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function select(next: Tab) {
    setTab(next);
    window.history.replaceState(null, "", `#${tabHash[next]}`);
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Guide sections"
        className="scrollbar-none scroll-fade-x -mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
      >
        {tabs.map((t) => {
          const active = t === tab;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={active}
              data-accent={tabAccents[t]}
              onClick={() => select(t)}
              className={`min-h-control shrink-0 rounded-full border px-5 text-callout font-bold transition-colors duration-150 ease-out ${
                active
                  ? "border-transparent bg-accent-subtle text-accent-deep"
                  : "border-default bg-card text-secondary"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div data-accent={tabAccents[tab]}>
        <SectionHeader className="mt-5" eyebrow={tab} title={tabHeadings[tab]} />

        <div className="mt-3 space-y-3">
          {tab === "Basics" && (
            <>
              <SeasonalWeatherCard />
              {basicsItems.map((item, i) => (
                <Fragment key={item.title}>
                  <InfoCard item={item} />
                  {i === 0 ? <WhereAreUCard headingLevel={3} /> : null}
                </Fragment>
              ))}
            </>
          )}

          {tab === "Scams" &&
            scams.map((s) => (
              <Card key={s.title} as="article" accentEdge>
                <h3 className="text-headline">{s.title}</h3>
                <p className="mt-1 text-caption font-semibold uppercase tracking-wide text-secondary">
                  {s.where}
                </p>
                <p className="body-copy mt-2 text-secondary">{s.how}</p>
                <p className="body-copy mt-2 rounded-xl bg-accent-subtle p-3 text-accent-deep">
                  <strong className="font-bold">Counter:</strong> {s.counter}
                </p>
              </Card>
            ))}

          {tab === "Phrases" &&
            phraseGroups.map((group) => (
              <section key={group.label} aria-label={group.label}>
                <h3 className="mt-2 text-headline">{group.label}</h3>
                <div className="mt-2 space-y-2">
                  {group.phrases.map((p) => (
                    <Card key={p.it} accentEdge>
                      <p className="text-caption font-semibold uppercase tracking-wide text-secondary">
                        {p.en}
                      </p>
                      <p className="mt-1 text-title text-accent-deep">
                        <ItalyFlag /> <i lang="it">{p.it}</i>
                      </p>
                      <p className="mt-1 text-subhead italic text-secondary">{p.say}</p>
                    </Card>
                  ))}
                </div>
              </section>
            ))}

          {tab === "Cities" &&
            regions.map((r) => (
              <Card key={r.name} as="article" accentEdge>
                <h3 className="title-section">{r.name}</h3>
                <p className="body-copy mt-1 font-medium text-secondary">{r.headline}</p>
                <h4 className="eyebrow mt-3">Watch for</h4>
                <ul className="mt-1 space-y-2">
                  {r.watch.map((w) => (
                    <li key={w} className="body-copy text-secondary">
                      <ColonLead text={w} />
                    </li>
                  ))}
                </ul>
                <h4 className="eyebrow mt-3">Moving around</h4>
                <ul className="mt-1 space-y-2">
                  {r.move.map((m) => (
                    <li key={m} className="body-copy text-secondary">
                      <ColonLead text={m} />
                    </li>
                  ))}
                </ul>
                {r.sections?.map((sec) => (
                  <div key={sec.label}>
                    <h4 className="eyebrow mt-3">{sec.label}</h4>
                    <ul className="mt-1 space-y-2">
                      {sec.bullets.map((b) => (
                        <li key={b} className="body-copy text-secondary">
                          <ColonLead text={b} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {r.links?.length ? <ResourceLinks links={r.links} /> : null}
                {r.caveat ? <Callout className="mt-3">{r.caveat}</Callout> : null}
              </Card>
            ))}

          {tab === "Health" && healthItems.map((item) => <InfoCard key={item.title} item={item} />)}
        </div>
      </div>
    </div>
  );
}
