"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDualDateTime } from "@/lib/timezones";
import { Check, MapPin } from "lucide-react";
import Icon from "@/components/Icon";
import DstNote from "@/components/DstNote";
import ReminderSettings from "@/components/ReminderSettings";
import TripTracking from "@/components/TripTracking";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Callout from "@/components/ui/Callout";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { Field, FieldError, Input, Textarea } from "@/components/ui/Field";
import ListRow from "@/components/ui/ListRow";
import SectionHeader from "@/components/ui/SectionHeader";
import Segmented from "@/components/ui/Segmented";
import { SkeletonCard } from "@/components/ui/Skeleton";

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

const statusMeta: Record<Status, { label: string; dot: string; tone: "verde" | "ambra" | "signal" }> = {
  safe: { label: "Safe", dot: "bg-verde", tone: "verde" },
  caution: { label: "Caution", dot: "bg-ambra", tone: "ambra" },
  // Solid signal is allowed here: selecting "help" is an emergency path.
  help: { label: "Need help", dot: "bg-signal", tone: "signal" },
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
  const [historyState, setHistoryState] = useState<"loading" | "ready" | "error">("loading");
  const [nearby, setNearby] = useState<NearbyAdvisory[]>([]);

  const loadHistory = useCallback(() => {
    let cancelled = false;
    setHistoryState("loading");
    fetch("/api/checkins")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("load failed"))))
      .then((data) => {
        if (cancelled) return;
        setHistory(data.checkIns ?? []);
        setHistoryState("ready");
      })
      .catch(() => {
        if (!cancelled) setHistoryState("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => loadHistory(), [loadHistory]);

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
        <Callout>
          <p className="font-bold">Alerts and advisories near your position</p>
          <ul className="mt-2 space-y-1">
            {nearby.map((a) => (
              <li key={a.title} className="text-subhead">
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
        </Callout>
      ) : null}

      <Card>
        <h2 className="text-headline">New check-in</h2>

        <Segmented
          className="mt-3"
          label="Status"
          value={status}
          onChange={setStatus}
          options={(Object.keys(statusMeta) as Status[]).map((s) => ({
            value: s,
            label: statusMeta[s].label,
            tone: statusMeta[s].tone,
          }))}
        />

        {status === "help" ? (
          <div className="mt-3">
            <p className="text-callout text-secondary">
              A check-in is not monitored in real time. If this is an emergency:
            </p>
            {/* Emergency variant: legitimate — this button dials 112. */}
            <Button variant="emergency" size="lg" href="tel:112" className="mt-2 w-full">
              Call 112 now
            </Button>
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          <Button variant="quiet" size="md" onClick={capture} disabled={locating} className="w-full">
            {locating ? (
              "Getting position…"
            ) : fix ? (
              <span className="flex items-center justify-center gap-2">
                <Icon icon={Check} size="sm" /> Position attached — tap to refresh
              </span>
            ) : (
              "Attach my position"
            )}
          </Button>
          {fix ? (
            <p className="font-mono text-footnote tabular-nums text-secondary">
              {fix.lat.toFixed(5)}, {fix.lng.toFixed(5)} · ~{Math.round(fix.accuracyM)} m
            </p>
          ) : null}

          <Field label="Place">
            <Input
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              placeholder="e.g. Hotel Aurora, Firenze"
              maxLength={120}
            />
          </Field>
          <Field label="Note">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional"
              maxLength={500}
              rows={2}
            />
          </Field>
        </div>

        {error ? <FieldError className="mt-3">{error}</FieldError> : null}
        {message ? (
          <p className="mt-3 text-callout font-semibold text-success" role="status">
            {message}
          </p>
        ) : null}

        <Button
          variant="primary"
          size="lg"
          onClick={() => void submit()}
          disabled={saving}
          className="mt-4 w-full"
        >
          {saving ? "Saving…" : "Save check-in"}
        </Button>
      </Card>

      <TripTracking
        onAutoCheckIn={(checkIn, advisories) => {
          setHistory((h) => [checkIn as CheckIn, ...h]);
          setNearby(advisories as NearbyAdvisory[]);
        }}
      />

      <ReminderSettings />

      <DstNote />

      <section>
        <SectionHeader title="History" />
        <div className="mt-3">
          {historyState === "loading" ? (
            <SkeletonCard lines={2} />
          ) : historyState === "error" ? (
            <EmptyState
              icon={MapPin}
              title="Couldn't load your history"
              body="It needs a connection. Your check-ins are safe on the server."
              action={
                <Button variant="secondary" size="md" onClick={loadHistory}>
                  Try again
                </Button>
              }
            />
          ) : history.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No check-ins yet"
              body="Your first one will appear here with its time and position."
            />
          ) : (
            <Card padded={false}>
              <ul className="divide-y divide-default">
                {history.map((c) => (
                  <li key={c.id}>
                    <ListRow
                      card={false}
                      href={
                        c.lat != null && c.lng != null
                          ? `https://maps.google.com/?q=${c.lat},${c.lng}`
                          : undefined
                      }
                      aria-label={
                        c.lat != null && c.lng != null
                          ? `${statusMeta[c.status].label} check-in — open position in Maps`
                          : undefined
                      }
                      icon={
                        <span
                          className={`block h-2.5 w-2.5 rounded-full ${statusMeta[c.status].dot}`}
                          aria-hidden="true"
                        />
                      }
                      title={
                        <span className="flex items-center gap-2">
                          {statusMeta[c.status].label}
                          {c.isAuto ? <Badge tone="neutral">Auto</Badge> : null}
                        </span>
                      }
                      subtitle={
                        <>
                          <span className="block tabular-nums">{formatWhen(c.createdAt)}</span>
                          {c.placeName ? (
                            <span className="block break-words text-subhead text-primary">
                              {c.placeName}
                            </span>
                          ) : null}
                          {c.note ? <span className="block break-words">{c.note}</span> : null}
                        </>
                      }
                    />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
