"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  CloudFog,
  CloudLightning,
  CloudOff,
  CloudRain,
  CloudSnow,
  Droplets,
  Flame,
  Mountain,
  ShieldCheck,
  Snowflake,
  Thermometer,
  TriangleAlert,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";
import Icon from "@/components/Icon";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { relativeTime } from "@/lib/relative-time";
import { ITALY_TZ } from "@/lib/timezones";

/**
 * "Official warnings — Italy" panel: MeteoAlarm (Protezione Civile
 * network), INGV earthquakes, GDACS disaster events, from /api/warnings.
 *
 * Rules encoded here:
 *  - Severity displays as a tinted Badge with the color NAMED in the
 *    label (color is never the only signal). Solid signal red stays
 *    reserved for emergency actions — a warning ABOUT danger is not an
 *    emergency button.
 *  - Every item shows source + time window + "checked Xm ago".
 *  - Sources fail individually: one dead feed renders one quiet line,
 *    never a blank section.
 *  - Offline: the last payload is kept in localStorage and rendered with
 *    its age — never blank.
 */

type WarningItem = {
  id: string;
  source: "meteoalarm" | "ingv" | "gdacs";
  externalId: string;
  kind: string;
  severity: string | null;
  title: string;
  area: string;
  regions: string[];
  magnitude: number | null;
  depthKm: number | null;
  onsetAt: string | null;
  expiresAt: string | null;
  publishedAt: string | null;
  url: string;
};

type SourceStatus = {
  source: "meteoalarm" | "ingv" | "gdacs";
  checkedAt: string | null;
  ok: boolean;
  stale: boolean;
};

type Payload = { warnings: WarningItem[]; checks: SourceStatus[] };

const CACHE_KEY = "sentinella-warnings-cache";

const SOURCE_LABEL: Record<WarningItem["source"], string> = {
  meteoalarm: "MeteoAlarm · Protezione Civile network",
  ingv: "INGV · Istituto Nazionale di Geofisica e Vulcanologia",
  gdacs: "GDACS · EU/UN Global Disaster Alert system",
};

/** Yellow/orange live in the warning tint (ambra owns caution); red uses
 *  the danger tint — a tint, never a solid fill. */
const SEVERITY_TONE: Record<string, "caution" | "critical"> = {
  yellow: "caution",
  orange: "caution",
  red: "critical",
};

const KIND_ICON: Array<{ match: RegExp; icon: LucideIcon }> = [
  { match: /earthquake|seismic/i, icon: Activity },
  { match: /thunder|storm/i, icon: CloudLightning },
  { match: /rain/i, icon: CloudRain },
  { match: /flood|coastal/i, icon: Waves },
  { match: /high.?temp|heat/i, icon: Thermometer },
  { match: /low.?temp|cold/i, icon: Snowflake },
  { match: /snow|ice/i, icon: CloudSnow },
  { match: /wind|cyclone/i, icon: Wind },
  { match: /fog/i, icon: CloudFog },
  { match: /fire/i, icon: Flame },
  { match: /volcan/i, icon: Mountain },
  { match: /drought/i, icon: Droplets },
];

function kindIcon(kind: string): LucideIcon {
  return KIND_ICON.find((k) => k.match.test(kind))?.icon ?? TriangleAlert;
}

/** "until Thu 18:00" in Italy's zone. */
function formatWindow(w: WarningItem): string | null {
  if (!w.expiresAt) return null;
  const t = new Date(w.expiresAt).toLocaleString("en-GB", {
    timeZone: ITALY_TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `until ${t.replace(",", "")}`;
}

export default function OfficialWarningsPanel() {
  const [data, setData] = useState<Payload | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "offline" | "error">("loading");
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  const load = useCallback(() => {
    setState("loading");
    fetch("/api/warnings")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((payload: Payload) => {
        setData(payload);
        setState("ready");
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ payload, at: new Date().toISOString() }));
        } catch {
          // Best effort.
        }
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem(CACHE_KEY);
          if (raw) {
            const { payload, at } = JSON.parse(raw) as { payload: Payload; at: string };
            setData(payload);
            setCachedAt(at);
            setState("offline");
            return;
          }
        } catch {
          // Fall through to the error state.
        }
        setState("error");
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (state === "loading") {
    return (
      <div className="space-y-3">
        <SkeletonCard lines={2} />
      </div>
    );
  }

  if (state === "error" || !data) {
    return (
      <EmptyState
        icon={CloudOff}
        title="Couldn't reach the warning services"
        body="Official warnings need a connection at least once. The Emergency and Guide screens keep working offline."
        action={
          <Button variant="tinted" size="md" onClick={load}>
            Try again
          </Button>
        }
      />
    );
  }

  // Expired items can linger in an offline cache: filter at render time
  // too, so a warning never outlives its window on screen.
  const now = Date.now();
  const active = data.warnings.filter((w) => !w.expiresAt || +new Date(w.expiresAt) > now);
  const failed = data.checks.filter((c) => !c.ok);
  const staleOk = data.checks.filter((c) => c.ok && c.stale);
  const checksBySource = new Map(data.checks.map((c) => [c.source, c]));

  return (
    <div className="space-y-3">
      {state === "offline" ? (
        <p className="rounded-xl bg-sunken px-3 py-2 text-footnote font-semibold text-secondary">
          Offline — showing warnings from {cachedAt ? relativeTime(new Date(cachedAt)) : "an earlier check"}.
        </p>
      ) : null}

      {active.length === 0 && failed.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No active official warnings for Lazio or Tuscany"
          body="MeteoAlarm, INGV, and GDACS all checked clean."
        />
      ) : null}

      {active.map((w) => {
        const check = checksBySource.get(w.source);
        const window = formatWindow(w);
        return (
          <Card key={w.id} as="article">
            <div className="flex flex-wrap items-center gap-2">
              {w.severity ? (
                <Badge tone={SEVERITY_TONE[w.severity] ?? "caution"}>{w.severity}</Badge>
              ) : w.magnitude != null ? (
                <Badge tone="caution">M {w.magnitude.toFixed(1)}</Badge>
              ) : null}
              {w.regions.map((r) => (
                <Badge key={r} tone="neutral">
                  {r}
                </Badge>
              ))}
              {window ? <span className="ml-auto text-footnote text-secondary">{window}</span> : null}
            </div>
            <h3 className="mt-2 flex items-start gap-2 break-words text-headline">
              <span className="mt-0.5 shrink-0 text-icon-default">
                <Icon icon={kindIcon(w.kind)} size="md" />
              </span>
              {w.title}
            </h3>
            <p className="mt-1 text-subhead text-secondary">
              {w.area}
              {w.magnitude != null && w.depthKm != null ? ` · ${Math.round(w.depthKm)} km deep` : ""}
            </p>
            <p className="mt-2 text-footnote text-secondary">
              {SOURCE_LABEL[w.source]} · checked{" "}
              {check?.checkedAt ? relativeTime(new Date(check.checkedAt)) : "never"} ·{" "}
              <a href={w.url} target="_blank" rel="noreferrer" className="text-link">
                Source
              </a>
            </p>
          </Card>
        );
      })}

      {/* Per-source failure lines: one dead feed never blanks the section. */}
      {failed.map((c) => (
        <p key={c.source} className="rounded-xl bg-sunken px-3 py-2 text-footnote text-secondary">
          {SOURCE_LABEL[c.source].split(" · ")[0]} couldn't be checked
          {c.checkedAt ? ` (last attempt ${relativeTime(new Date(c.checkedAt))})` : ""} — anything it
          publishes may be missing above.
        </p>
      ))}
      {staleOk.map((c) => (
        <p key={c.source} className="text-footnote text-secondary">
          {SOURCE_LABEL[c.source].split(" · ")[0]} last checked{" "}
          {c.checkedAt ? relativeTime(new Date(c.checkedAt)) : "—"} — older than its refresh
          schedule.
        </p>
      ))}
    </div>
  );
}
