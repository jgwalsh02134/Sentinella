"use client";

import { useEffect, useMemo, useState } from "react";
import TelText from "@/components/TelText";
import { ADVISORY_LEVEL_NAMES } from "@/lib/advisory-levels";
import { readLastFix } from "@/lib/lastFix";
import { nearestRegion } from "@/lib/region-geo";

type Item = {
  id: string;
  source: "state_advisory" | "state_rss" | "embassy";
  title: string;
  body: string;
  url: string;
  level: number | null;
  regions: string[];
  publishedAt: string | null;
  fetchedAt: string;
};

type Payload = {
  advisory: Item | null;
  items: Item[];
  lastCheckedAt: string | null;
  stale: boolean;
};

/**
 * Level 1–2 use the working/caution tints; levels 3–4 use the signal tint —
 * genuine emergency-adjacent signaling, the allowed use of red.
 */
const LEVEL_BADGE: Record<number, string> = {
  1: "bg-success-subtle text-success",
  2: "bg-warning-subtle text-warning",
  3: "bg-danger-subtle text-danger",
  4: "bg-danger-subtle text-danger",
};

const SOURCE_LABEL: Record<Item["source"], string> = {
  state_advisory: "U.S. Department of State",
  state_rss: "U.S. Department of State",
  embassy: "U.S. Mission Italy",
};

function formatDate(iso: string | null): string {
  if (!iso) return "date not stated";
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function UsAdvisoriesPanel() {
  const [data, setData] = useState<Payload | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "offline">("loading");
  const [nearRegion, setNearRegion] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/advisories/us")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
      .then((payload: Payload) => {
        if (cancelled) return;
        setData(payload);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("offline");
      });

    // "Near you" needs a position: a fix shared this session, else the
    // latest check-in with coordinates (signed-in users only; 401 is fine).
    const fix = readLastFix();
    if (fix) {
      setNearRegion(nearestRegion(fix.lat, fix.lng));
    } else {
      fetch("/api/checkins")
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
        .then((payload) => {
          if (cancelled) return;
          const withCoords = (payload.checkIns ?? []).find(
            (c: { lat: number | null; lng: number | null }) => c.lat != null && c.lng != null,
          );
          if (withCoords) setNearRegion(nearestRegion(withCoords.lat, withCoords.lng));
        })
        .catch(() => undefined);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const lists = useMemo(() => {
    const items = (data?.items ?? []).filter((i) => i.source !== "state_advisory");
    if (!nearRegion) return { near: [], rest: items };
    return {
      near: items.filter((i) => i.regions.includes(nearRegion)),
      rest: items.filter((i) => !i.regions.includes(nearRegion)),
    };
  }, [data, nearRegion]);

  if (state === "loading") return <p className="text-body text-secondary">Checking official sources…</p>;

  if (state === "offline" || !data) {
    return (
      <div className="plate border border-default bg-card p-4">
        <p className="body-copy text-secondary">
          Official advisories need a connection and couldn't load. The Emergency and Guide screens
          keep working offline.
        </p>
      </div>
    );
  }

  const adv = data.advisory;

  return (
    <div className="space-y-3">
      {adv?.level ? (
        <div className="plate border border-default bg-card p-4">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-caption font-bold uppercase tracking-wide ${LEVEL_BADGE[adv.level] ?? "bg-warning-subtle text-warning"}`}
            >
              Level {adv.level}
            </span>
            <span className="text-footnote font-semibold text-secondary">Italy Travel Advisory</span>
          </div>
          <p className="mt-2 text-title tracking-tight">
            {ADVISORY_LEVEL_NAMES[adv.level] ?? adv.title}
          </p>
          <p className="mt-1 text-footnote text-secondary">Issued {formatDate(adv.publishedAt)}</p>
          {adv.body ? <p className="body-copy mt-2 break-words text-secondary">{adv.body.split("\n")[0]}</p> : null}
          <a href={adv.url} target="_blank" rel="noreferrer" className="text-link mt-2 block text-callout">
            Read the official advisory on travel.state.gov →
          </a>
        </div>
      ) : (
        <div className="plate border border-default bg-card p-4">
          <p className="body-copy text-secondary">
            The current Italy advisory level hasn't been fetched yet. It appears after the first
            successful check of travel.state.gov.
          </p>
        </div>
      )}

      {data.stale ? (
        <p className="callout">
          Couldn't reach the .gov sources recently — showing the last copies retrieved
          {data.lastCheckedAt ? ` ${formatWhen(data.lastCheckedAt)}` : ""}. Verify against the
          official links before acting.
        </p>
      ) : null}

      {lists.near.length > 0 ? (
        <>
          <h3 className="eyebrow pt-1">Near you — {nearRegion}</h3>
          <AdvisoryList items={lists.near} />
        </>
      ) : null}

      {lists.rest.length > 0 ? (
        <>
          {lists.near.length > 0 ? <h3 className="eyebrow pt-1">Elsewhere in Italy</h3> : null}
          <AdvisoryList items={lists.rest} />
        </>
      ) : lists.near.length === 0 ? (
        <div className="plate border border-default bg-card p-4">
          <p className="body-copy text-secondary">No embassy or consulate advisories on file yet.</p>
        </div>
      ) : null}

      <p className="text-footnote text-secondary">
        Source: U.S. Department of State and U.S. Mission Italy (public-domain). Last checked{" "}
        {data.lastCheckedAt ? formatWhen(data.lastCheckedAt) : "never"}.
      </p>
    </div>
  );
}

function AdvisoryList({ items }: { items: Item[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="plate border border-default bg-card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-info-subtle px-2.5 py-1 text-caption font-bold uppercase tracking-wide text-info">
              Official
            </span>
            {item.regions.map((r) => (
              <span
                key={r}
                className="rounded-full border border-default px-2.5 py-1 text-caption font-semibold text-secondary"
              >
                {r}
              </span>
            ))}
            <span className="ml-auto text-footnote text-secondary">{formatDate(item.publishedAt)}</span>
          </div>
          <h3 className="mt-2 break-words text-headline">{item.title}</h3>
          {item.body ? (
            <details className="mt-1">
              <summary className="cursor-pointer text-callout font-semibold text-info">
                Details
              </summary>
              <p className="body-copy mt-1 whitespace-pre-line break-words text-secondary">
                <TelText text={item.body} />
              </p>
            </details>
          ) : null}
          <p className="mt-2 text-footnote text-secondary">
            {SOURCE_LABEL[item.source]} ·{" "}
            <a href={item.url} target="_blank" rel="noreferrer" className="text-link">
              Official notice →
            </a>
          </p>
        </li>
      ))}
    </ul>
  );
}
