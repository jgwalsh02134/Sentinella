"use client";

import { useState } from "react";
import ItalyFlag from "@/components/ItalyFlag";
import SeasonalWeatherCard from "@/components/SeasonalWeatherCard";
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

/** Body copy with a bold first-sentence lead. */
function LeadBody({ text }: { text: string }) {
  const split = splitFirstSentence(text);
  if (!split) return <>{text}</>;
  return (
    <>
      <strong className="font-bold text-primary">{split[0]}</strong> {split[1]}
    </>
  );
}

/** City-briefing bullets: bold the place/topic before a leading colon. */
function ColonLead({ text }: { text: string }) {
  const idx = text.indexOf(":");
  if (idx === -1 || idx > 40) return <>{text}</>;
  return (
    <>
      <strong className="font-bold text-primary">{text.slice(0, idx + 1)}</strong>
      {text.slice(idx + 1)}
    </>
  );
}

/** Basics and Health share one card layout. */
function InfoCard({ item }: { item: InfoItem }) {
  return (
    <article className="plate border border-default border-l-4 border-l-accent bg-card p-5">
      <h3 className="text-headline">{item.title}</h3>
      <p className="body-copy mt-1.5 text-secondary">
        <LeadBody text={item.body} />
      </p>
      {item.bullets?.length ? (
        <ul className="mt-2 space-y-1.5">
          {item.bullets.map((b) => (
            <li key={b} className="body-copy text-secondary">
              <ColonLead text={b} />
            </li>
          ))}
        </ul>
      ) : null}
      {item.warning ? <p className="callout mt-2.5">{item.warning}</p> : null}
      {item.links?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.links.map((link) => {
            const external = !link.url.startsWith("/");
            return (
              <a
                key={link.url}
                href={link.url}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="flex min-h-[2.75rem] min-w-0 items-center justify-center rounded-xl border-2 border-accent px-4 text-center text-callout font-bold text-accent active:bg-accent-subtle"
              >
                {link.label}
              </a>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}

export default function GuideTabs() {
  const [tab, setTab] = useState<Tab>("Basics");

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
              onClick={() => setTab(t)}
              className={`min-h-[2.75rem] shrink-0 rounded-full border-2 px-5 text-callout font-bold transition-colors ${
                active ? "border-accent bg-accent-subtle text-accent" : "border-default bg-card text-secondary"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div data-accent={tabAccents[tab]}>
      <header className="mt-4">
        <p className="eyebrow text-accent">{tab}</p>
        <h2 className="title-section">{tabHeadings[tab]}</h2>
      </header>

      <div className="mt-3 space-y-3">
        {tab === "Basics" && (
          <>
            <SeasonalWeatherCard />
            {basicsItems.map((item) => (
              <InfoCard key={item.title} item={item} />
            ))}
          </>
        )}

        {tab === "Scams" &&
          scams.map((s) => (
            <article key={s.title} className="plate border border-default border-l-4 border-l-accent bg-card p-5">
              <h3 className="text-headline">{s.title}</h3>
              <p className="mt-0.5 text-caption font-semibold uppercase tracking-wide text-secondary">
                {s.where}
              </p>
              <p className="body-copy mt-2 text-secondary">{s.how}</p>
              <p className="body-copy mt-2 rounded-xl bg-accent-subtle p-3 text-accent-deep">
                <strong className="font-bold">Counter:</strong> {s.counter}
              </p>
            </article>
          ))}

        {tab === "Phrases" &&
          phraseGroups.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <h3 className="eyebrow mt-2">{group.label}</h3>
              <div className="mt-2 space-y-2">
                {group.phrases.map((p) => (
                  <div key={p.it} className="plate border border-default border-l-4 border-l-accent bg-card p-4">
                    <p className="text-caption font-semibold uppercase tracking-wide text-secondary">
                      {p.en}
                    </p>
                    <p className="mt-1 text-title text-accent-deep">
                      <ItalyFlag /> <i lang="it">{p.it}</i>
                    </p>
                    <p className="mt-0.5 text-subhead italic text-secondary">{p.say}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}

        {tab === "Cities" &&
          regions.map((r) => (
            <article key={r.name} className="plate border border-default border-l-4 border-l-accent bg-card p-5">
              <h3 className="title-section">{r.name}</h3>
              <p className="body-copy mt-0.5 font-medium text-accent">{r.headline}</p>
              <h4 className="eyebrow mt-3">Watch for</h4>
              <ul className="mt-1 space-y-1.5">
                {r.watch.map((w) => (
                  <li key={w} className="body-copy text-secondary">
                    <ColonLead text={w} />
                  </li>
                ))}
              </ul>
              <h4 className="eyebrow mt-3">Moving around</h4>
              <ul className="mt-1 space-y-1.5">
                {r.move.map((m) => (
                  <li key={m} className="body-copy text-secondary">
                    <ColonLead text={m} />
                  </li>
                ))}
              </ul>
              {r.sections?.map((sec) => (
                <div key={sec.label}>
                  <h4 className="eyebrow mt-3">{sec.label}</h4>
                  <ul className="mt-1 space-y-1.5">
                    {sec.bullets.map((b) => (
                      <li key={b} className="body-copy text-secondary">
                        <ColonLead text={b} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {r.links?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.links.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-[2.75rem] min-w-0 items-center justify-center rounded-xl border-2 border-accent px-4 text-center text-callout font-bold text-accent active:bg-accent-subtle"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              ) : null}
              {r.caveat ? <p className="callout mt-3">{r.caveat}</p> : null}
            </article>
          ))}

        {tab === "Health" && healthItems.map((item) => <InfoCard key={item.title} item={item} />)}
      </div>
      </div>
    </div>
  );
}
