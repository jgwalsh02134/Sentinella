"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Disclosure from "@/components/ui/Disclosure";
import SectionHeader from "@/components/ui/SectionHeader";
import { predeparture } from "@/data/predeparture";

/**
 * Renders the pre-departure content as a tappable checklist. Checked state
 * lives in localStorage only — it's personal trip prep, not account data,
 * and it must work offline and logged out.
 *
 * Each item is a checkbox row; the explanation sits behind a Disclosure,
 * closed by default, so the list scans as a list.
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

/** Section liveries via the accent slot; labels carry the meaning. */
const sectionAccents: Record<string, string> = {
  "entry-rules": "azzurro",
  "global-entry": "oliva",
  health: "glicine",
  setup: "terracotta",
};

export default function PrepareChecklist() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setChecked(readChecked());
    setHydrated(true);
  }, []);

  const allIds = useMemo(
    () => predeparture.flatMap((section) => section.items.map((item) => item.id)),
    [],
  );
  const doneCount = allIds.filter((id) => checked.has(id)).length;

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

  return (
    <div>
      <p className="text-subhead font-semibold text-brand" role="status">
        {hydrated ? `${doneCount} of ${allIds.length} done` : `${allIds.length} items`}
      </p>

      <div className="mt-5 space-y-8">
        {predeparture.map((section) => (
          <section
            key={section.id}
            aria-label={section.title}
            data-accent={sectionAccents[section.id]}
          >
            <SectionHeader title={section.title} />
            <ul className="mt-3 space-y-3">
              {section.items.map((item) => {
                const done = checked.has(item.id);
                return (
                  <Card key={item.id} as="li">
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={done}
                        aria-label={item.title}
                        onClick={() => toggle(item.id)}
                        className="-ml-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center"
                      >
                        <span
                          aria-hidden="true"
                          className={`flex h-6 w-6 items-center justify-center rounded-xs border-2 transition-colors duration-150 ease-out ${
                            done ? "border-accent bg-accent text-on-accent" : "border-strong bg-card"
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
                      </button>
                      <div className="min-w-0 flex-1">
                        <Disclosure
                          label={
                            <span
                              className={`break-words ${done ? "text-secondary line-through" : ""}`}
                            >
                              {item.title}
                            </span>
                          }
                        >
                          <p className="body-copy whitespace-pre-line break-words pt-1 text-secondary">
                            {item.body}
                          </p>
                          {item.links.length > 0 ? (
                            <p className="flex flex-wrap gap-x-4 gap-y-2 break-words pb-1 pt-2">
                              {item.links.map((link) => (
                                <a
                                  key={link.href}
                                  href={link.href}
                                  target={link.href.startsWith("/") ? undefined : "_blank"}
                                  rel={link.href.startsWith("/") ? undefined : "noreferrer"}
                                  className="text-link inline-block py-1 text-callout"
                                >
                                  {link.label}
                                </a>
                              ))}
                            </p>
                          ) : null}
                        </Disclosure>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
