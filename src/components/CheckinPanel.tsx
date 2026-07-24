"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  QUEUE_EVENT,
  enqueueCheckIn,
  listQueued,
  syncQueue,
  updateQueued,
  type QueuedCheckIn,
} from "@/lib/checkinQueue";

type Status = "safe" | "caution" | "help";

type CheckIn = {
  id: string;
  clientId?: string | null;
  status: Status;
  lat: number | null;
  lng: number | null;
  accuracyM: number | null;
  placeName: string | null;
  note: string | null;
  isAuto?: boolean;
  createdAt: string;
  /** True while the row lives only in the local queue. */
  pending?: boolean;
};

/**
 * GPS as an enhancement, never a requirement: resolve a fix within
 * `timeoutMs` or resolve null — the check-in has ALREADY saved by the
 * time this runs.
 */
function getFix(timeoutMs = 10000): Promise<{ lat: number; lng: number; accuracyM: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      resolve(null);
      return;
    }
    let settled = false;
    const settle = (v: { lat: number; lng: number; accuracyM: number } | null) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(v);
      }
    };
    // Belt and braces: browsers apply the `timeout` option unevenly.
    const timer = setTimeout(() => settle(null), timeoutMs + 500);
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        settle({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: pos.coords.accuracy,
        }),
      () => settle(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 },
    );
  });
}

function queuedToCheckIn(q: QueuedCheckIn): CheckIn {
  return {
    id: q.clientId,
    clientId: q.clientId,
    status: q.status,
    lat: q.lat,
    lng: q.lng,
    accuracyM: q.accuracyM,
    placeName: q.placeName,
    note: q.note,
    isAuto: q.isAuto,
    createdAt: q.createdAt,
    pending: true,
  };
}

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
  const [gpsNote, setGpsNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState<{ at: Date; clientId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serverHistory, setServerHistory] = useState<CheckIn[]>([]);
  const [queued, setQueued] = useState<CheckIn[]>([]);
  const [historyState, setHistoryState] = useState<"loading" | "ready" | "error">("loading");
  const [authNeeded, setAuthNeeded] = useState(false);
  const [nearby, setNearby] = useState<NearbyAdvisory[]>([]);
  const submittingRef = useRef(false);

  const refreshQueued = useCallback(() => {
    void listQueued().then((items) => setQueued(items.map(queuedToCheckIn)));
  }, []);

  const loadHistory = useCallback(() => {
    let cancelled = false;
    setHistoryState("loading");
    fetch("/api/checkins")
      .then((r) => {
        if (r.status === 401) {
          setAuthNeeded(true);
          return { checkIns: [] };
        }
        return r.ok ? r.json() : Promise.reject(new Error("load failed"));
      })
      .then((data) => {
        if (cancelled) return;
        setServerHistory(data.checkIns ?? []);
        setHistoryState("ready");
      })
      .catch(async () => {
        // Offline: queued items still render; server rows return later.
        const localCount = (await listQueued()).length;
        if (!cancelled) setHistoryState(localCount > 0 ? "ready" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Drain the queue and reconcile: the ONE sync entry point for this screen. */
  const runSync = useCallback(async () => {
    const result = await syncQueue();
    setAuthNeeded(result.authRequired);
    if (result.synced > 0) {
      loadHistory();
    }
  }, [loadHistory]);

  // Sync triggers: app open (mount), connectivity regained, app focus.
  // Login lands back here, so mount also covers "after successful auth".
  useEffect(() => {
    loadHistory();
    refreshQueued();
    void runSync();

    const onOnline = () => void runSync();
    const onVisible = () => {
      if (document.visibilityState === "visible") void runSync();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(QUEUE_EVENT, refreshQueued);
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(QUEUE_EVENT, refreshQueued);
    };
  }, [loadHistory, refreshQueued, runSync]);

  function capture() {
    setGpsNote(null);
    setLocating(true);
    void getFix().then((got) => {
      setLocating(false);
      if (got) setFix(got);
      else setGpsNote("GPS unavailable — check-ins still save without location.");
    });
  }

  /**
   * A CHECK-IN NEVER FAILS: write locally first (instant — the button is
   * only disabled for this write), then enhance with GPS in the
   * background, then sync when network and auth allow.
   */
  async function submit() {
    // Synchronous re-entry guard: React state can't flip `disabled` fast
    // enough to stop a double-tap (the diagnosed duplicate bug).
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSaving(true);
    setError(null);
    setGpsNote(null);
    const clientId = crypto.randomUUID();
    const item: QueuedCheckIn = {
      clientId,
      status,
      lat: fix?.lat ?? null,
      lng: fix?.lng ?? null,
      accuracyM: fix?.accuracyM ?? null,
      placeName: placeName.trim() || null,
      note: note.trim() || null,
      isAuto: false,
      createdAt: new Date().toISOString(),
    };

    try {
      await enqueueCheckIn(item);
    } catch {
      // No IndexedDB (rare: some private modes). Fall back to a direct
      // network save so the tap still counts.
      try {
        const res = await fetch("/api/checkins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        if (!res.ok) throw new Error();
        const data = await res.json().catch(() => ({}));
        setServerHistory((h) => [data.checkIn, ...h]);
        setNearby(data.advisories ?? []);
      } catch {
        submittingRef.current = false;
        setSaving(false);
        setError("This browser couldn't store the check-in. Try again — or call if urgent.");
        return;
      }
    }

    // Saved. Everything past this point is enhancement.
    setConfirmed({ at: new Date(), clientId });
    setPlaceName("");
    setNote("");
    submittingRef.current = false;
    setSaving(false);

    const hadFix = fix != null;
    setFix(null);

    if (!hadFix) {
      // Background GPS, capped at 10s: attach coordinates if they arrive
      // while the item is still queued; say so plainly if they don't.
      void getFix().then(async (got) => {
        if (got) {
          const attached = await updateQueued(clientId, got);
          if (attached) refreshQueued();
        } else {
          setGpsNote("Saved without location — GPS unavailable.");
        }
        void runSync();
      });
    } else {
      void runSync();
    }
  }

  const pendingIds = new Set(queued.map((c) => c.clientId));
  const history: CheckIn[] = [
    ...queued,
    ...serverHistory.filter((c) => !c.clientId || !pendingIds.has(c.clientId)),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const confirmedPending = confirmed ? pendingIds.has(confirmed.clientId) : false;

  return (
    <div className="space-y-6">
      {authNeeded && queued.length > 0 ? (
        // ONE quiet banner — never red, never blocking: the check-ins are
        // safe locally and sync automatically after sign-in.
        <div className="plate flex flex-wrap items-center justify-between gap-3 border border-default bg-card p-4">
          <p className="text-subhead text-secondary">
            Signed out — sign in to sync {queued.length}{" "}
            {queued.length === 1 ? "check-in" : "check-ins"}.
          </p>
          <Button href="/login?next=/checkin" variant="tinted" size="sm">
            Sign in
          </Button>
        </div>
      ) : null}

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
          <Button variant="gray" size="md" onClick={capture} disabled={locating} className="w-full">
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
          {gpsNote ? (
            <p className="text-footnote text-secondary" role="status">
              {gpsNote}
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
        {confirmed ? (
          <p className="mt-3 text-callout font-semibold text-success" role="status">
            Checked in ·{" "}
            {confirmed.at.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} ·{" "}
            {confirmedPending ? (authNeeded ? "waiting for sign-in" : "syncing…") : "synced"}
          </p>
        ) : null}

        <Button
          variant="filled"
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
          setServerHistory((h) => [checkIn as CheckIn, ...h]);
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
                <Button variant="tinted" size="md" onClick={loadHistory}>
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
                          {c.pending ? <Badge tone="neutral">Pending sync</Badge> : null}
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
