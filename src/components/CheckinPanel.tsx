"use client";

import { useEffect, useState } from "react";

type Status = "safe" | "caution" | "help";

type CheckIn = {
  id: string;
  status: Status;
  lat: number | null;
  lng: number | null;
  accuracyM: number | null;
  placeName: string | null;
  note: string | null;
  createdAt: string;
};

const statusMeta: Record<Status, { label: string; dot: string; chip: string }> = {
  safe: { label: "Safe", dot: "bg-verde", chip: "border-verde bg-verde text-white" },
  caution: { label: "Caution", dot: "bg-ambra", chip: "border-ambra bg-ambra text-white" },
  help: { label: "Need help", dot: "bg-signal", chip: "border-signal bg-signal text-white" },
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
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
      <div className="plate border border-line bg-white p-5">
        <p className="eyebrow">New check-in</p>

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
                className={`min-h-[3rem] rounded-xl border-2 px-2 text-sm font-bold transition-colors ${
                  selected ? meta.chip : "border-line bg-white text-mist"
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
            className="mt-3 block rounded-xl bg-signal-tint p-3 text-sm font-semibold text-signal-deep"
          >
            If this is an emergency, call 112 now — a check-in is not monitored in real time.
          </a>
        ) : null}

        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={capture}
            disabled={locating}
            className="min-h-[3rem] w-full rounded-xl border-2 border-verde px-4 font-semibold text-verde active:bg-verde-tint disabled:opacity-60"
          >
            {locating ? "Getting position…" : fix ? "Position attached ✓ (tap to refresh)" : "Attach my position"}
          </button>
          {fix ? (
            <p className="font-mono text-xs tabular-nums text-mist">
              {fix.lat.toFixed(5)}, {fix.lng.toFixed(5)} · ~{Math.round(fix.accuracyM)} m
            </p>
          ) : null}

          <input
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            placeholder="Place (e.g. Hotel Aurora, Firenze)"
            maxLength={120}
            className="min-h-[3rem] w-full rounded-xl border border-line bg-white px-4 text-base outline-none focus:border-verde"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            maxLength={500}
            rows={2}
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none focus:border-verde"
          />
        </div>

        {error ? <p className="mt-3 text-sm font-medium text-signal-deep">{error}</p> : null}
        {message ? <p className="mt-3 text-sm font-semibold text-verde">{message}</p> : null}

        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="mt-4 min-h-[3.25rem] w-full rounded-xl bg-verde text-base font-bold text-white active:bg-verde-deep disabled:opacity-60"
        >
          {saving ? "Saving…" : "Check in"}
        </button>
      </div>

      <section>
        <p className="eyebrow">History</p>
        {loadingHistory ? (
          <p className="mt-3 text-sm text-mist">Loading…</p>
        ) : history.length === 0 ? (
          <p className="mt-3 text-sm text-mist">
            No check-ins yet. Your first one will appear here with its time and position.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {history.map((c) => (
              <li key={c.id} className="plate border border-line bg-white p-4">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${statusMeta[c.status].dot}`} aria-hidden="true" />
                  <span className="text-sm font-bold">{statusMeta[c.status].label}</span>
                  <span className="ml-auto text-xs text-mist">{formatWhen(c.createdAt)}</span>
                </div>
                {c.placeName ? <p className="mt-1 text-sm">{c.placeName}</p> : null}
                {c.note ? <p className="mt-1 text-sm text-mist">{c.note}</p> : null}
                {c.lat != null && c.lng != null ? (
                  <a
                    href={`https://maps.google.com/?q=${c.lat},${c.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block font-mono text-xs tabular-nums text-verde underline"
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
