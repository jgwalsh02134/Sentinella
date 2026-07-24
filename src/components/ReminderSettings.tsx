"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import { FieldError } from "@/components/ui/Field";
import Segmented from "@/components/ui/Segmented";

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
    <Card>
      <h2 className="text-headline">Check-in reminders</h2>
      <p className="mt-2 text-subhead text-secondary">
        Get a nudge when you haven't checked in for a while. If a reminder goes unanswered for an
        hour, your admins are notified — that's the safety net.
      </p>
      <Segmented
        className="mt-3"
        label="Reminder interval"
        value={hours ?? 0}
        onChange={(next) => void select(next)}
        disabled={hours === null}
        options={OPTIONS.map((opt) => ({ value: opt.hours as number, label: opt.label }))}
      />
      <p className="mt-2 text-footnote text-secondary">
        Reminders arrive as notifications — turn those on from the card on the home screen.
      </p>
      {error ? <FieldError className="mt-2">{error}</FieldError> : null}
    </Card>
  );
}
