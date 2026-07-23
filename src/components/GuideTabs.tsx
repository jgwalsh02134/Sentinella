"use client";

import { useState } from "react";
import ItalyFlag from "@/components/ItalyFlag";
import { scams } from "@/data/scams";
import { phraseGroups } from "@/data/phrases";
import { regions } from "@/data/regions";
import { healthItems, basicsItems } from "@/data/health";

const tabs = ["Basics", "Scams", "Phrases", "Cities", "Health"] as const;
type Tab = (typeof tabs)[number];

export default function GuideTabs() {
  const [tab, setTab] = useState<Tab>("Basics");

  return (
    <div>
      <div
        role="tablist"
        aria-label="Guide sections"
        className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
      >
        {tabs.map((t) => {
          const active = t === tab;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t)}
              className={`min-h-[2.75rem] shrink-0 rounded-full border-2 px-5 text-sm font-bold transition-colors ${
                active ? "border-verde bg-verde text-white" : "border-line bg-white text-mist"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-3">
        {tab === "Basics" &&
          basicsItems.map((item) => (
            <article key={item.title} className="plate border border-line bg-white p-5">
              <h2 className="text-base font-bold leading-snug">{item.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-mist">{item.body}</p>
            </article>
          ))}

        {tab === "Scams" &&
          scams.map((s) => (
            <article key={s.title} className="plate border border-line bg-white p-5">
              <h2 className="text-base font-bold leading-snug">{s.title}</h2>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-mist">
                {s.where}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-mist">{s.how}</p>
              <p className="mt-2 rounded-xl bg-verde-tint p-3 text-sm font-medium leading-relaxed text-verde-deep">
                {s.counter}
              </p>
            </article>
          ))}

        {tab === "Phrases" &&
          phraseGroups.map((group) => (
            <section key={group.label}>
              <p className="eyebrow mt-2">{group.label}</p>
              <div className="mt-2 space-y-2">
                {group.phrases.map((p) => (
                  <div key={p.it} className="plate border border-line bg-white p-4">
                    <p className="text-base font-bold text-verde-deep">
                      <ItalyFlag /> {p.it}
                    </p>
                    <p className="text-sm text-ink">{p.en}</p>
                    <p className="mt-0.5 font-mono text-xs text-mist">{p.say}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}

        {tab === "Cities" &&
          regions.map((r) => (
            <article key={r.name} className="plate border border-line bg-white p-5">
              <h2 className="text-lg font-bold">{r.name}</h2>
              <p className="mt-0.5 text-sm font-medium text-verde-deep">{r.headline}</p>
              <p className="eyebrow mt-3">Watch for</p>
              <ul className="mt-1 space-y-1.5">
                {r.watch.map((w) => (
                  <li key={w} className="text-sm leading-relaxed text-mist">
                    {w}
                  </li>
                ))}
              </ul>
              <p className="eyebrow mt-3">Moving around</p>
              <ul className="mt-1 space-y-1.5">
                {r.move.map((m) => (
                  <li key={m} className="text-sm leading-relaxed text-mist">
                    {m}
                  </li>
                ))}
              </ul>
            </article>
          ))}

        {tab === "Health" &&
          healthItems.map((item) => (
            <article key={item.title} className="plate border border-line bg-white p-5">
              <h2 className="text-base font-bold leading-snug">{item.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-mist">{item.body}</p>
            </article>
          ))}
      </div>
    </div>
  );
}
