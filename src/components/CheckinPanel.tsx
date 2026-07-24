"use client";

import { useEffect, useState } from "react";
import { formatDualDateTime } from "@/lib/timezones";
import { Check } from "lucide-react";
import Icon from "@/components/Icon";
import DstNote from "@/components/DstNote";
import ReminderSettings from "@/components/ReminderSettings";
import TripTracking from "@/components/TripTracking";

type Status = "safe" | "caution" | "help";

type CheckIn = {
  id: string;
  status: Status;
  lat: number | null;
  lng: number | null;
  accuracyM: number | null;
  placeName: string | null;
  note: string | null;
  isAuto?: boolean;
  createdAt: string;
};

type NearbyAdvisory = {
  source: "team" | "official";
  title: string;
  badge: string | null;
  url: string | null;
};

const statusMeta: Record<Status, { label: string; dot: string; chip: string }> = {
  safe: { label: "Safe", dot: "bg-verde", chip: "border-verde bg-verde text-white" },
  caution: { label: "Caution", dot: "bg-ambra", chip: "border-ambra bg-ambra text-white" },
  help: { label: "Need help", dot: "bg-signal", chip: "border-signal bg-signal text-white" },
};

/** Dual-zone timestamp: the trip runs on Italy time, family reads New York. */
function formatWhen(iso: string) {
  return formatDualDateTime(new Date(iso));
}

export default function CheckinPanel() {
  const [status, setStatus] = useState<Status>("safe");
  const [placeName, setPlaceName] = useState("");
  const [note, setNote] = useState("");
  const [fix, setFix] = useState<{ lat: number; lng: number; accuracyM: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<CheckIn[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [nearby, setNearby] = useState<NearbyAdvisory[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/checkins")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load failed"))))
      .then((data) => {
        if (!cancelled) setHistory(data.checkIns ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your history. It will appear when you're back online.");
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function capture() {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFix({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: pos.coords.accuracy,
        });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  }

  async function submit() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          lat: fix?.lat ?? null,
          lng: fix?.lng ?? null,
          accuracyM: fix?.accuracyM ?? null,
          placeName: placeName || undefined,
          note: note || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Check-in didn't save.");
      setHistory((h) => [data.checkIn, ...h]);
      setNearby(data.advisories ?? []);
      setMessage("Checked in.");
      setPlaceName("");
      setNote("");
      setFix(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check-in didn't save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {nearby.length > 0 ? (
        <div className="rounded-xl bg-ambra-tint p-4" role="status">
          <p className="text-callout font-bold text-ambra">Alerts and advisories near your position</p>
          <ul className="mt-2 space-y-1">
            {nearby.map((a) => (
              <li key={a.title} className="text-subhead text-ambra">
                {a.badge ? <span className="font-bold uppercase">{a.badge} · </span> : null}
                {a.url ? (
                  <a
                    href={a.url}
                    target={a.url.startsWith("/") ? undefined : "_blank"}
                    rel="noreferrer"
                    className="underline underline-offset-2"
                  >
                    {a.title}
                  </a>
                ) : (
                  a.title
                )}
                <span className="text-footnote"> ({a.source === "team" ? "team" : "official"})</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="plate border border-default bg-card p-4">
        <h2 className="text-headline">New check-in</h2>

        <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Status">
          {(Object.keys(statusMeta) as Status[]).map((s) => {
            const meta = statusMeta[s];
            const selected = status === s;
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setStatus(s)}
                className={`min-h-[3rem] rounded-xl border-2 px-2 text-callout font-bold transition-colors ${
                  selected ? meta.chip : "border-default bg-card text-secondary"
                }`}
              >
                {meta.label}
              </button>
            );
          })}
        </div>

        {status === "help" ? (
          <a
            href="tel:112"
            className="mt-3 block rounded-xl bg-signal-tint p-3 text-callout font-semibold text-danger"
          >
            If this is an emergency, call 112 now — a check-in is not monitored in real time.
          </a>
        ) : null}

        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={capture}
            disabled={locating}
            className="min-h-[3rem] w-full rounded-xl border-2 border-verde px-4 font-semibold text-verde active:bg-accent-subtle disabled:bg-sunken disabled:text-tertiary"
          >
            {locating ? (
              "Getting position…"
            ) : fix ? (
              <span className="flex items-center justify-center gap-2">
                <Icon icon={Check} size="sm" /> Position attached (tap to refresh)
              </span>
            ) : (
              "Attach my position"
            )}
          </button>
          {fix ? (
            <p className="font-mono text-footnote tabular-nums text-secondary">
              {fix.lat.toFixed(5)}, {fix.lng.toFixed(5)} · ~{Math.round(fix.accuracyM)} m
            </p>
          ) : null}

          <input
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            placeholder="Place (e.g. Hotel Aurora, Firenze)"
            maxLength={120}
            className="min-h-[3rem] w-full rounded-xl border border-default bg-card px-4 text-body outline-none focus:border-verde"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            maxLength={500}
            rows={2}
            className="w-full rounded-xl border border-default bg-card px-4 py-3 text-body outline-none focus:border-verde"
          />
        </div>

        {error ? <p className="mt-3 text-callout font-medium text-danger">{error}</p> : null}
        {message ? <p className="mt-3 text-callout font-semibold text-verde">{message}</p> : null}

        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="mt-4 min-h-[3.25rem] w-full rounded-xl bg-verde text-body font-bold text-white active:bg-brand-strong disabled:bg-sunken disabled:text-tertiary"
        >
          {saving ? "Saving…" : "Check in"}
        </button>
      </div>

      <TripTracking
        onAutoCheckIn={(checkIn, advisories) => {
          setHistory((h) => [checkIn as CheckIn, ...h]);
          setNearby(advisories as NearbyAdvisory[]);
        }}
      />

      <ReminderSettings />

      <DstNote />

      <section>
        <h2 className="title-section">History</h2>
        {loadingHistory ? (
          <p className="mt-3 text-body text-secondary">Loading…</p>
        ) : history.length === 0 ? (
          <p className="mt-3 text-body text-secondary">
            No check-ins yet. Your first one will appear here with its time and position.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {history.map((c) => (
              <li key={c.id} className="plate border border-default bg-card p-4">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${statusMeta[c.status].dot}`} aria-hidden="true" />
                  <span className="text-callout font-bold">{statusMeta[c.status].label}</span>
                  {c.isAuto ? (
                    <span className="rounded-full border border-default px-2 py-1 text-caption font-semibold uppercase tracking-wide text-secondary">
                      Auto
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-footnote tabular-nums text-secondary">{formatWhen(c.createdAt)}</p>
                {c.placeName ? <p className="mt-1 break-words text-subhead">{c.placeName}</p> : null}
                {c.note ? <p className="mt-1 break-words text-subhead text-secondary">{c.note}</p> : null}
                {c.lat != null && c.lng != null ? (
                  <a
                    href={`https://maps.google.com/?q=${c.lat},${c.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-link mt-1 inline-block break-all font-mono text-footnote tabular-nums"
                  >
                    {c.lat.toFixed(5)}, {c.lng.toFixed(5)}
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
