"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import Icon from "@/components/Icon";

/**
 * "More cities" collapse. Native <details> so the content stays reachable
 * with JS disabled; the client layer auto-opens it when a search deep-link
 * targets a city inside (e.g. /guide/cities#venice) and scrolls there.
 */
export default function MoreCities({
  anchors,
  children,
}: {
  /** Anchor ids of the cards inside — hash matches open the collapse. */
  anchors: string[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function check() {
      const hash = window.location.hash.replace(/^#/, "");
      if (anchors.includes(hash)) {
        setOpen(true);
        requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView());
      }
    }
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, [anchors]);

  return (
    <details
      open={open}
      onToggle={(ev) => setOpen((ev.target as HTMLDetailsElement).open)}
      className="plate group/more border border-default bg-card p-4"
    >
      <summary className="flex min-h-control cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-headline">More cities</span>
          <span className="block text-footnote text-secondary">
            Venice, Milan, Naples, southern driving
          </span>
        </span>
        <span
          aria-hidden="true"
          className="shrink-0 text-tertiary transition-transform duration-200 ease-out group-open/more:rotate-180 motion-reduce:transition-none"
        >
          <Icon icon={ChevronDown} size="md" />
        </span>
      </summary>
      <div className="mt-2 space-y-3">{children}</div>
    </details>
  );
}
