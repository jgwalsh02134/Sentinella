"use client";

import { useEffect, useState } from "react";
import { isDstMismatch } from "@/lib/timezones";

/**
 * Informational note for the one autumn week when Italy has changed
 * clocks and the US hasn't. Visibility comes from the actual computed
 * UTC offsets at render time — no hardcoded dates — so it self-activates
 * every year. Dismissal is remembered per year so next year's window
 * shows it again.
 */
export default function DstNote() {
  const [visible, setVisible] = useState(false);

  const dismissKey = `sentinella-dst-note-${new Date().getFullYear()}`;

  useEffect(() => {
    if (!isDstMismatch()) return;
    try {
      if (localStorage.getItem(dismissKey) === "1") return;
    } catch {
      // Storage unavailable: show it; dismissal just won't persist.
    }
    setVisible(true);
  }, [dismissKey]);

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(dismissKey, "1");
    } catch {
      // Best effort.
    }
  }

  return (
    <div className="flex items-start gap-2 rounded-xl bg-warning-subtle p-3" role="note">
      <p className="flex-1 text-sm leading-relaxed text-warning">
        Italy changed clocks on Oct 25; the US changes Nov 1 — Italy is{" "}
        <strong className="font-bold">5 hours ahead this week, not 6</strong>.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss time-difference note"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-warning"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );
}
