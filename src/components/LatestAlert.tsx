"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Alert = {
  id: string;
  title: string;
  severity: "info" | "advisory" | "critical";
  region: string;
};

const badge: Record<Alert["severity"], string> = {
  info: "bg-verde-tint text-verde-deep",
  advisory: "bg-ambra-tint text-ambra",
  critical: "bg-signal-tint text-signal-deep",
};

export default function LatestAlert() {
  const [alert, setAlert] = useState<Alert | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "offline">("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/alerts")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
      .then((data) => {
        if (cancelled) return;
        setAlert(data.alerts?.[0] ?? null);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("offline");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") return null;

  if (state === "offline") {
    return (
      <p className="text-sm text-mist">
        Advisories need a connection. Emergency numbers and the guide work offline.
      </p>
    );
  }

  if (!alert) {
    return <p className="text-sm text-mist">No active advisories right now.</p>;
  }

  return (
    <Link href="/alerts" className="plate block border border-line bg-white p-4">
      <span className="flex items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${badge[alert.severity]}`}
        >
          {alert.severity}
        </span>
        <span className="min-w-0 truncate text-xs font-semibold text-mist">{alert.region}</span>
      </span>
      <span className="mt-2 block break-words text-sm font-bold leading-snug">{alert.title}</span>
      <span className="mt-1 block text-xs font-semibold text-verde">All advisories →</span>
    </Link>
  );
}
