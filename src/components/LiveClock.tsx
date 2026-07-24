"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import Icon from "@/components/Icon";
import Card from "@/components/ui/Card";
import {
  ITALY_TZ,
  NEW_YORK_TZ,
  formatDualTime,
  isDstMismatch,
  italyAheadHours,
} from "@/lib/timezones";

/**
 * Live dual-timezone clock — Europe/Rome and America/New_York via Intl
 * with explicit IANA zones (src/lib/timezones.ts). Fully offline: it reads
 * the device clock, nothing else.
 *
 * Ticks once per minute, aligned to the minute boundary, and stops
 * entirely while the tab is hidden (visibilitychange) — a hidden clock
 * burning timers is waste. On return it re-syncs immediately.
 *
 * The DST-mismatch line reuses the existing offset-derived logic
 * (isDstMismatch/italyAheadHours): during the autumn week when Italy has
 * fallen back but the US hasn't, it says so — computed, never hardcoded.
 */
export default function LiveClock({
  variant = "compact",
  className = "",
}: {
  /** compact: one-line strip (Home). full: card with large times (check-in). */
  variant?: "compact" | "full";
  className?: string;
}) {
  // null until mounted: the server can't know the client's clock, so we
  // render a stable placeholder to avoid a hydration mismatch.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    function tick() {
      setNow(new Date());
      // Align the next tick to the minute boundary (+50ms of slack).
      timer = setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50);
    }

    function onVisibility() {
      if (document.hidden) {
        if (timer) clearTimeout(timer);
        timer = null;
      } else if (!timer) {
        tick();
      }
    }

    tick();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const mismatch = now ? isDstMismatch(now) : false;
  const mismatchLine = now
    ? `Italy is ${italyAheadHours(now)} hours ahead this week, not 6.`
    : "";

  if (variant === "compact") {
    return (
      <div className={className}>
        <p className="flex min-h-5 items-center gap-2 text-footnote text-secondary">
          <Icon icon={Clock3} size="sm" className="shrink-0" />
          <span aria-live="off">{now ? `${formatDate(now)} · ${formatDualTime(now)}` : "\u00A0"}</span>
        </p>
        {mismatch ? (
          <p className="mt-1 text-footnote font-semibold text-warning" role="note">
            {mismatchLine}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <Card className={className}>
      <h2 className="flex items-center gap-2 text-footnote font-semibold uppercase tracking-wide text-secondary">
        <Icon icon={Clock3} size="sm" /> {now ? formatDate(now) : "Local time"}
      </h2>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <div>
          <p className="font-mono text-title tabular-nums tracking-tight">
            {now ? timeIn(now, ITALY_TZ, "en-GB") : "--:--"}
          </p>
          <p className="mt-0.5 text-footnote text-secondary">Italy</p>
        </div>
        <div>
          <p className="font-mono text-title tabular-nums tracking-tight">
            {now ? timeIn(now, NEW_YORK_TZ, "en-US") : "--:--"}
          </p>
          <p className="mt-0.5 text-footnote text-secondary">New York</p>
        </div>
      </div>
      {mismatch ? (
        <p className="mt-2 text-footnote font-semibold text-warning" role="note">
          {mismatchLine}
        </p>
      ) : null}
    </Card>
  );
}

/** "Tue, Oct 20" — the date where the traveler is (Italy's zone). */
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    timeZone: ITALY_TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function timeIn(date: Date, timeZone: string, locale: string): string {
  return date.toLocaleTimeString(locale, {
    timeZone,
    hour: locale === "en-GB" ? "2-digit" : "numeric",
    minute: "2-digit",
  });
}
