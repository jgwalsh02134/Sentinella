"use client";

import { useEffect, useState } from "react";

type Severity = "info" | "advisory" | "critical";

type Alert = {
  id: string;
  title: string;
  body: string;
  severity: Severity;
  region: string;
  createdAt: string;
};

const severityMeta: Record<Severity, { label: string; badge: string }> = {
  info: { label: "Info", badge: "bg-info-subtle text-info" },
  advisory: { label: "Advisory", badge: "bg-warning-subtle text-warning" },
  critical: { label: "Critical", badge: "bg-danger-subtle text-danger" },
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [severity, setSeverity] = useState<Severity>("advisory");
  const [region, setRegion] = useState("Nationwide");
  const [publishing, setPublishing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/alerts")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
      .then((data) => {
        if (!cancelled) setAlerts(data.alerts ?? []);
      })
      .catch(() => {
        if (!cancelled) setOffline(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setIsAdmin(data.user?.role === "admin");
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  async function publish() {
    setPublishing(true);
    setFormError(null);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, severity, region }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "The alert didn't publish.");
      setAlerts((a) => [data.alert, ...a]);
      setTitle("");
      setBody("");
      setShowForm(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "The alert didn't publish. Try again.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-4">
      {isAdmin ? (
        <div className="plate border border-line bg-white p-4">
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="min-h-[2.75rem] w-full rounded-xl border-2 border-verde font-semibold text-verde active:bg-accent-subtle"
          >
            {showForm ? "Close" : "Publish an alert"}
          </button>
          {showForm ? (
            <div className="mt-4 space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                maxLength={140}
                className="min-h-[3rem] w-full rounded-xl border border-line px-4 text-base outline-none focus:border-verde"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What travelers should know and do"
                maxLength={2000}
                rows={4}
                className="w-full rounded-xl border border-line px-4 py-3 text-base outline-none focus:border-verde"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as Severity)}
                  aria-label="Severity"
                  className="min-h-[3rem] rounded-xl border border-line bg-white px-3 text-base outline-none focus:border-verde"
                >
                  <option value="info">Info</option>
                  <option value="advisory">Advisory</option>
                  <option value="critical">Critical</option>
                </select>
                <input
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="Region"
                  maxLength={80}
                  aria-label="Region"
                  className="min-h-[3rem] rounded-xl border border-line px-4 text-base outline-none focus:border-verde"
                />
              </div>
              {formError ? <p className="text-sm font-medium text-signal-deep">{formError}</p> : null}
              <button
                type="button"
                onClick={publish}
                disabled={publishing || !title.trim() || !body.trim()}
                className="min-h-[3rem] w-full rounded-xl bg-verde font-bold text-white active:bg-brand-strong disabled:bg-sunken disabled:text-tertiary"
              >
                {publishing ? "Publishing…" : "Publish"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-mist">Loading advisories…</p>
      ) : offline ? (
        <div className="plate border border-line bg-white p-5">
          <p className="text-sm leading-relaxed text-mist">
            Advisories need a connection and couldn't load. The Emergency and Guide screens keep
            working offline.
          </p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="plate border border-line bg-white p-5">
          <p className="text-sm leading-relaxed text-mist">
            No active advisories. When one is published it appears here — check back before travel
            days and after any major news.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {alerts.map((a) => (
            <li key={a.id} className="plate border border-line bg-white p-5">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${severityMeta[a.severity].badge}`}
                >
                  {severityMeta[a.severity].label}
                </span>
                <span className="text-xs font-semibold text-mist">{a.region}</span>
                <span className="ml-auto text-xs text-mist">{formatWhen(a.createdAt)}</span>
              </div>
              <h2 className="mt-2 break-words text-base font-bold leading-snug">{a.title}</h2>
              <p className="body-copy mt-1 break-words text-mist">{a.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
