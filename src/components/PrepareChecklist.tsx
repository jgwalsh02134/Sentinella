"use client";

import { useEffect, useState } from "react";
import VerifiedCaveat from "@/components/VerifiedCaveat";
import { predeparture } from "@/data/predeparture";

/**
 * Renders the pre-departure content as a tappable checklist. Checked state
 * lives in localStorage only — it's personal trip prep, not account data,
 * and it must work offline and logged out.
 */

const STORAGE_KEY = "sentinella-prepare-v1";

function readChecked(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export default function PrepareChecklist() {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    setChecked(readChecked());
  }, []);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // Private browsing: the list still works, it just won't remember.
      }
      return next;
    });
  }

  /** Section liveries via the accent slot; labels carry the meaning. */
  const sectionAccents: Record<string, string> = {
    "entry-rules": "azzurro",
    "global-entry": "oliva",
    health: "glicine",
    setup: "terracotta",
  };

  return (
    <div className="space-y-6">
      {predeparture.map((section) => (
        <section
          key={section.id}
          aria-label={section.title}
          data-accent={sectionAccents[section.id]}
        >
          <h2 className="title-section">{section.title}</h2>
          <ul className="mt-2 space-y-3">
            {section.items.map((item) => {
              const done = checked.has(item.id);
              return (
                <li key={item.id} className="plate border border-default border-l-4 border-l-accent bg-card p-4">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={done}
                    onClick={() => toggle(item.id)}
                    className="flex min-h-[2.75rem] w-full items-start gap-3 text-left"
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${
                        done ? "border-accent bg-accent text-on-accent" : "border-default bg-card"
                      }`}
                    >
                      {done ? (
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m5 13 4 4L19 7" />
                        </svg>
                      ) : null}
                    </span>
                    <span
                      className={`min-w-0 break-words text-headline ${done ? "text-secondary line-through" : ""}`}
                    >
                      {item.title}
                    </span>
                  </button>
                  <p className="body-copy mt-2 whitespace-pre-line break-words pl-9 text-secondary">
                    {item.body}
                  </p>
                  {item.links.length > 0 ? (
                    <p className="mt-2 space-x-4 break-words pl-9">
                      {item.links.map((link) => (
                        <a
                          key={link.href}
                          href={link.href}
                          target={link.href.startsWith("/") ? undefined : "_blank"}
                          rel={link.href.startsWith("/") ? undefined : "noreferrer"}
                          className="text-link text-callout"
                        >
                          {link.label} →
                        </a>
                      ))}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <VerifiedCaveat>Rules, prices, and coverage change</VerifiedCaveat>
        </section>
      ))}
    </div>
  );
}
