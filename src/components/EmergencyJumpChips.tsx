"use client";

import { useEffect, useState } from "react";
import type { MouseEvent } from "react";

/**
 * Quick-jump chip row for the Emergency screen — PLAIN-style anchor
 * links that smooth-scroll to the page's sections. Rendered only after
 * mount: without JS the chips don't appear at all (the page reads fine
 * top to bottom without them). Wraps to two lines at large Dynamic Type
 * instead of overflowing.
 */
const JUMPS = [
  { label: "Numbers", target: "numbers" },
  { label: "U.S. help", target: "us-help" },
  { label: "Medical", target: "medical" },
  { label: "If it goes wrong", target: "robbed" },
  { label: "Tools", target: "tools" },
] as const;

export default function EmergencyJumpChips({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  function jump(e: MouseEvent<HTMLAnchorElement>, target: string) {
    const el = document.getElementById(target);
    if (!el) return; // unknown target: let the browser handle the hash
    e.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  return (
    <nav aria-label="Jump to section" className={`flex flex-wrap gap-y-0 ${className}`}>
      {JUMPS.map((j, i) => (
        <span key={j.target} className="flex items-center">
          {i > 0 ? (
            <span aria-hidden="true" className="text-tertiary">
              ·
            </span>
          ) : null}
          <a
            href={`#${j.target}`}
            onClick={(e) => jump(e, j.target)}
            className="inline-flex min-h-11 items-center px-1.5 text-subhead font-semibold text-brand"
          >
            {j.label}
          </a>
        </span>
      ))}
    </nav>
  );
}
