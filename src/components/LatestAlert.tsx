"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type TeamAlert = {
  id: string;
  title: string;
  severity: "info" | "advisory" | "critical";
  region: string;
  createdAt: string;
};

type OfficialItem = {
  id: string;
  source: "state_advisory" | "state_rss" | "embassy";
  title: string;
  level: number | null;
  regions: string[];
  publishedAt: string | null;
  fetchedAt: string;
};

type Candidate = {
  title: string;
  badge: string;
  badgeClass: string;
  region: string;
  /** 3 = act now, 2 = caution, 1 = informational; ties break by recency. */
  rank: number;
  at: number;
};

const TEAM_BADGE: Record<TeamAlert["severity"], { rank: number; className: string }> = {
  info: { rank: 1, className: "bg-info-subtle text-info" },
  advisory: { rank: 2, className: "bg-warning-subtle text-warning" },
  critical: { rank: 3, className: "bg-danger-subtle text-danger" },
};

function teamCandidate(alert: TeamAlert): Candidate {
  const meta = TEAM_BADGE[alert.severity];
  return {
    title: alert.title,
    badge: alert.severity,
    badgeClass: meta.className,
    region: alert.region,
    rank: meta.rank,
    at: new Date(alert.createdAt).getTime(),
  };
}

function officialCandidate(item: OfficialItem): Candidate {
  const rank = item.source === "state_advisory" ? Math.min(item.level ?? 1, 3) : 2;
  const badgeClass =
    rank >= 3
      ? "bg-danger-subtle text-danger"
      : rank === 2
        ? "bg-warning-subtle text-warning"
        : "bg-success-subtle text-success";
  return {
    title: item.title,
    badge: item.level ? `Official · Level ${item.level}` : "Official",
    badgeClass,
    region: item.regions.length ? item.regions.join(", ") : "Italy",
    rank,
    at: new Date(item.publishedAt ?? item.fetchedAt).getTime(),
  };
}

/** Home-screen teaser: whichever advisory — team or official — matters most. */
export default function LatestAlert() {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "offline">("loading");

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      fetch("/api/alerts").then((r) => (r.ok ? r.json() : Promise.reject(new Error()))),
      fetch("/api/advisories/us").then((r) => (r.ok ? r.json() : Promise.reject(new Error()))),
    ]).then(([team, official]) => {
      if (cancelled) return;
      if (team.status === "rejected" && official.status === "rejected") {
        setState("offline");
        return;
      }
      const candidates: Candidate[] = [];
      if (team.status === "fulfilled" && team.value.alerts?.[0]) {
        candidates.push(teamCandidate(team.value.alerts[0]));
      }
      if (official.status === "fulfilled") {
        const items: OfficialItem[] = official.value.items ?? [];
        const newest = items.find((i) => i.source !== "state_advisory");
        if (newest) candidates.push(officialCandidate(newest));
        if (official.value.advisory) candidates.push(officialCandidate(official.value.advisory));
      }
      candidates.sort((a, b) => b.rank - a.rank || b.at - a.at);
      setCandidate(candidates[0] ?? null);
      setState("ready");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") return null;

  if (state === "offline") {
    return (
      <p className="text-sm text-secondary">
        Advisories need a connection. Emergency numbers and the guide work offline.
      </p>
    );
  }

  if (!candidate) {
    return <p className="text-sm text-secondary">No active advisories right now.</p>;
  }

  return (
    <Link href="/alerts" className="plate block border border-default bg-card p-4">
      <span className="flex items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${candidate.badgeClass}`}
        >
          {candidate.badge}
        </span>
        <span className="min-w-0 truncate text-xs font-semibold text-secondary">{candidate.region}</span>
      </span>
      <span className="mt-2 block break-words text-sm font-bold leading-snug">{candidate.title}</span>
      <span className="mt-1 block text-xs font-semibold text-info">All advisories →</span>
    </Link>
  );
}
