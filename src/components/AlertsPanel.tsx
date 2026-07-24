"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, CloudOff } from "lucide-react";
import TelText from "@/components/TelText";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { Field, FieldError, Input, Select, Textarea } from "@/components/ui/Field";
import { SkeletonCard } from "@/components/ui/Skeleton";

type Severity = "info" | "advisory" | "critical";

type Alert = {
  id: string;
  title: string;
  body: string;
  severity: Severity;
  region: string;
  createdAt: string;
};

/* Display labels only — the stored severity values are unchanged. The
   middle tier shows as "Caution" because "advisory" is reserved app-wide
   for official government guidance (see the glossary in .cursorrules). */
const severityMeta: Record<Severity, { label: string; tone: "info" | "caution" | "critical" }> = {
  info: { label: "Info", tone: "info" },
  advisory: { label: "Caution", tone: "caution" },
  critical: { label: "Critical", tone: "critical" },
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
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [severity, setSeverity] = useState<Severity>("advisory");
  const [region, setRegion] = useState("Nationwide");
  const [publishing, setPublishing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    setState("loading");
    fetch("/api/alerts")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
      .then((data) => {
        if (cancelled) return;
        setAlerts(data.alerts ?? []);
        setUpdatedAt(new Date());
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cancel = load();
    let cancelled = false;
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setIsAdmin(data.user?.role === "admin");
      })
      .catch(() => undefined);
    return () => {
      cancel();
      cancelled = true;
    };
  }, [load]);

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
    <div className="space-y-3">
      {isAdmin ? (
        <Card>
          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowForm((v) => !v)}
            className="w-full"
          >
            {showForm ? "Close" : "Publish an alert"}
          </Button>
          {showForm ? (
            <div className="mt-4 space-y-3">
              <Field label="Title">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={140}
                />
              </Field>
              <Field label="Message">
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="What travelers should know and do"
                  maxLength={2000}
                  rows={4}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Severity">
                  <Select value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
                    <option value="info">Info</option>
                    <option value="advisory">Caution</option>
                    <option value="critical">Critical</option>
                  </Select>
                </Field>
                <Field label="Region">
                  <Input value={region} onChange={(e) => setRegion(e.target.value)} maxLength={80} />
                </Field>
              </div>
              {formError ? <FieldError>{formError}</FieldError> : null}
              <Button
                variant="primary"
                size="lg"
                onClick={() => void publish()}
                disabled={publishing || !title.trim() || !body.trim()}
                className="w-full"
              >
                {publishing ? "Publishing…" : "Publish alert"}
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}

      {state === "loading" ? (
        <>
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </>
      ) : state === "error" ? (
        <EmptyState
          icon={CloudOff}
          title="Couldn't reach the advisory service"
          body="Team alerts need a connection. The Emergency and Guide screens keep working offline."
          action={
            <Button variant="secondary" size="md" onClick={load}>
              Try again
            </Button>
          }
        />
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No active alerts"
          body="When an admin publishes one it appears here — check back before travel days and after any major news."
        />
      ) : (
        <ul className="space-y-3">
          {alerts.map((a) => (
            <Card key={a.id} as="li">
              <div className="flex items-center gap-2">
                <Badge tone={severityMeta[a.severity].tone}>{severityMeta[a.severity].label}</Badge>
                <span className="text-footnote font-semibold text-secondary">{a.region}</span>
                <span className="ml-auto text-footnote text-secondary">{formatWhen(a.createdAt)}</span>
              </div>
              <h3 className="mt-2 break-words text-headline">{a.title}</h3>
              <p className="body-copy mt-1 break-words text-secondary">
                <TelText text={a.body} />
              </p>
            </Card>
          ))}
        </ul>
      )}

      {state === "ready" && updatedAt ? (
        <p className="text-footnote text-secondary">
          Last updated{" "}
          {updatedAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}.
        </p>
      ) : null}
    </div>
  );
}
