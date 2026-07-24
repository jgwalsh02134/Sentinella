"use client";

import { useEffect, useState } from "react";

/**
 * Check-in reminder interval, stored on the user row. The cron job nudges
 * users whose interval has elapsed since their last check-in, and escalates
 * to admins when a reminder goes unanswered for an hour.
 */

const OPTIONS = [
  { hours: 0, label: "Off" },
  { hours: 4, label: "4 h" },
  { hours: 8, label: "8 h" },
  { hours: 24, label: "24 h" },
] as const;

export default function ReminderSettings() {
  const [hours, setHours] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/push/subscribe")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
      .then((data) => {
        if (!cancelled) setHours(data.preferences?.checkinReminderHours ?? 0);
      })
      .catch(() => {
        if (!cancelled) setHours(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function select(next: number) {
    const prev = hours;
    setHours(next);
    setError(null);
    const res = await fetch("/api/push/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkinReminderHours: next }),
    }).catch(() => null);
    if (!res?.ok) {
      setHours(prev);
      setError("Couldn't save. Check your connection and try again.");
    }
  }

  return (
    <div className="plate border border-line bg-white p-5">
      <h2 className="text-sm font-bold">Check-in reminders</h2>
      <p className="mt-1 text-xs leading-relaxed text-mist">
        Get a nudge when you haven't checked in for a while. If a reminder goes unanswered for an
        hour, your admins are notified — that's the safety net.
      </p>
      <div className="mt-3 grid grid-cols-4 gap-2" role="radiogroup" aria-label="Reminder interval">
        {OPTIONS.map((opt) => {
          const selected = hours === opt.hours;
          return (
            <button
              key={opt.hours}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={hours === null}
              onClick={() => void select(opt.hours)}
              className={`min-h-[2.75rem] rounded-xl border-2 text-sm font-bold transition-colors disabled:border-neutral-300 disabled:text-tertiary ${
                selected ? "border-verde bg-verde text-white" : "border-line bg-white text-mist"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-mist">
        Reminders arrive as notifications — turn those on from the card on the home screen.
      </p>
      {error ? <p className="mt-2 text-sm font-medium text-signal-deep">{error}</p> : null}
    </div>
  );
}
