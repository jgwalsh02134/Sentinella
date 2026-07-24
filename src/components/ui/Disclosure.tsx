"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import Icon from "@/components/Icon";

/**
 * Progressive detail behind a chevron button. Proper aria-expanded /
 * aria-controls wiring; the open/close is the app's one structural
 * animation (200ms ease-out), gone under prefers-reduced-motion.
 */
export default function Disclosure({
  label,
  sublabel,
  children,
  defaultOpen = false,
  className = "",
}: {
  label: ReactNode;
  sublabel?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-control w-full items-center justify-between gap-3 text-left"
      >
        <span className="min-w-0">
          <span className="block text-headline">{label}</span>
          {sublabel ? (
            <span className="block text-footnote text-secondary">{sublabel}</span>
          ) : null}
        </span>
        <span
          className={`shrink-0 text-tertiary transition-transform duration-200 ease-out motion-reduce:transition-none ${
            open ? "rotate-180" : ""
          }`}
        >
          <Icon icon={ChevronDown} size="md" />
        </span>
      </button>
      <div
        id={panelId}
        className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className={open ? "" : "invisible"}>{children}</div>
        </div>
      </div>
    </div>
  );
}
