"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, WifiOff } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";

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

type BadgeTone = "info" | "caution" | "critical" | "success";

type Candidate = {
  title: string;
  badge: string;
  tone: BadgeTone;
  region: string;
  /** 3 = act now, 2 = caution, 1 = informational; ties break by recency. */
  rank: number;
  at: number;
};

/* Team severities display as Info/Caution/Critical — "advisory" is
   reserved app-wide for official government guidance. */
const TEAM_BADGE: Record<TeamAlert["severity"], { rank: number; label: string; tone: BadgeTone }> = {
  info: { rank: 1, label: "Info", tone: "info" },
  advisory: { rank: 2, label: "Caution", tone: "caution" },
  critical: { rank: 3, label: "Critical", tone: "critical" },
};

function teamCandidate(alert: TeamAlert): Candidate {
  const meta = TEAM_BADGE[alert.severity];
  return {
    title: alert.title,
    badge: meta.label,
    tone: meta.tone,
    region: alert.region,
    rank: meta.rank,
    at: new Date(alert.createdAt).getTime(),
  };
}

function officialCandidate(item: OfficialItem): Candidate {
  const rank = item.source === "state_advisory" ? Math.min(item.level ?? 1, 3) : 2;
  const tone: BadgeTone = rank >= 3 ? "critical" : rank === 2 ? "caution" : "success";
  return {
    title: item.title,
    badge: item.level ? `Official · Level ${item.level}` : "Official",
    tone,
    region: item.regions.length ? item.regions.join(", ") : "Italy",
    rank,
    at: new Date(item.publishedAt ?? item.fetchedAt).getTime(),
  };
}

/** Home-screen teaser: whichever advisory — team or official — matters most. */
export default function LatestAlert() {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "offline">("loading");

  const load = useCallback(() => {
    let cancelled = false;
    setState("loading");

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

  useEffect(() => load(), [load]);

  if (state === "loading") {
    return <SkeletonCard lines={1} />;
  }

  if (state === "offline") {
    return (
      <EmptyState
        icon={WifiOff}
        title="Advisories couldn't load"
        body="They update when you reconnect. Emergency numbers and the guide still work."
        action={
          <Button variant="secondary" size="md" onClick={load}>
            Try again
          </Button>
        }
      />
    );
  }

  if (!candidate) {
    return (
      <EmptyState
        icon={ShieldCheck}
        tone="success"
        title="No active advisories"
        body="Nothing needs your attention right now."
      />
    );
  }

  return (
    <Link href="/alerts" prefetch={false} className="plate block border border-default bg-card p-4">
      <span className="flex items-center gap-2">
        <Badge tone={candidate.tone}>{candidate.badge}</Badge>
        <span className="min-w-0 truncate text-footnote font-semibold text-secondary">
          {candidate.region}
        </span>
      </span>
      <span className="mt-2 block break-words text-headline">{candidate.title}</span>
      <span className="text-link mt-1 inline-block text-footnote">See all alerts</span>
    </Link>
  );
}
