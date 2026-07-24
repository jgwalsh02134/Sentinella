"use client";

import { useEffect, useRef, useState } from "react";
import { saveLastFix } from "@/lib/lastFix";
import { distanceKm } from "@/lib/region-geo";

/**
 * "Track my trip" — honest about the platform: web apps get GPS only while
 * the page is open and visible. watchPosition streams fixes and we post an
 * automatic check-in every 5 minutes or 250 m moved, whichever comes first.
 * Tracking stops (not pauses) on toggle off, navigation away, or page hide —
 * iOS gives a web app no way to keep watching in the background, and
 * pretending otherwise would be a safety lie.
 */

const AUTO_INTERVAL_MS = 5 * 60 * 1000;
const AUTO_DISTANCE_KM = 0.25;
const POLL_MS = 30 * 1000;

type LiveFix = { lat: number; lng: number; accuracyM: number };

type Props = {
  /** Called with the created check-in row and any nearby advisories. */
  onAutoCheckIn: (checkIn: unknown, advisories: unknown[]) => void;
};

export default function TripTracking({ onAutoCheckIn }: Props) {
  const [active, setActive] = useState(false);
  const [live, setLive] = useState<LiveFix | null>(null);
  const [lastSentAt, setLastSentAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestRef = useRef<LiveFix | null>(null);
  const lastSentRef = useRef<{ lat: number; lng: number; at: number } | null>(null);
  const sendingRef = useRef(false);
  const onAutoCheckInRef = useRef(onAutoCheckIn);
  onAutoCheckInRef.current = onAutoCheckIn;

  async function sendAuto(fix: LiveFix) {
    if (sendingRef.current) return;
    sendingRef.current = true;
    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "safe",
          lat: fix.lat,
          lng: fix.lng,
          accuracyM: fix.accuracyM,
          isAuto: true,
        }),
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      lastSentRef.current = { lat: fix.lat, lng: fix.lng, at: Date.now() };
      setLastSentAt(new Date());
      if (data.checkIn) onAutoCheckInRef.current(data.checkIn, data.advisories ?? []);
    } catch {
      // Offline or flaky signal: keep tracking, the next fix retries.
    } finally {
      sendingRef.current = false;
    }
  }

  function maybeSend() {
    const fix = latestRef.current;
    if (!fix) return;
    const last = lastSentRef.current;
    const due =
      !last ||
      Date.now() - last.at >= AUTO_INTERVAL_MS ||
      distanceKm({ lat: last.lat, lng: last.lng }, { lat: fix.lat, lng: fix.lng }) >= AUTO_DISTANCE_KM;
    if (due) void sendAuto(fix);
  }

  function stop() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    latestRef.current = null;
    lastSentRef.current = null;
    setActive(false);
    setLive(null);
  }

  function start() {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("This device doesn't expose location to the browser.");
      return;
    }
    setActive(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const fix = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: pos.coords.accuracy,
        };
        latestRef.current = fix;
        setLive(fix);
        saveLastFix(fix.lat, fix.lng);
        maybeSend();
      },
      (err) => {
        stop();
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission was denied. Enable it in your browser settings to track."
            : "Lost the GPS signal. Move toward open sky and switch tracking back on.",
        );
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 5000 },
    );
    timerRef.current = setInterval(maybeSend, POLL_MS);
  }

  useEffect(() => {
    // Stop on page hide (screen lock, app switch, tab close) and unmount —
    // the browser would freeze the watcher anyway; stopping makes it honest.
    const onHide = () => {
      if (document.visibilityState === "hidden") stop();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", stop);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", stop);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function formatClock(d: Date) {
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <>
      {active ? (
        <div
          className="sticky top-2 z-20 flex items-center gap-2 rounded-full border border-verde/30 bg-verde-tint px-4 py-2"
          role="status"
          aria-live="polite"
        >
          <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-verde opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-verde" />
          </span>
          <span className="text-footnote font-semibold text-verde-deep">
            Trip tracking on — auto check-in every 5 min or 250 m
          </span>
        </div>
      ) : null}

      <div className="plate border border-default bg-card p-5">
        <div className="flex min-h-[2.75rem] items-center gap-3">
          <div className="flex-1">
            <h2 className="text-headline">Track my trip</h2>
            <p className="text-footnote text-secondary">Automatic safe check-ins while this screen is open.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={active}
            aria-label="Track my trip"
            onClick={() => (active ? stop() : start())}
            className="flex h-11 w-14 shrink-0 items-center justify-center rounded-lg"
          >
            <span
              aria-hidden="true"
              className={`relative h-8 w-[3.25rem] rounded-full transition-colors motion-reduce:transition-none ${active ? "bg-verde" : "bg-line"}`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-card shadow transition-transform motion-reduce:transition-none ${active ? "translate-x-[1.5rem]" : "translate-x-1"}`}
              />
            </span>
          </button>
        </div>

        {active ? (
          <div className="mt-3 rounded-xl bg-verde-tint p-3">
            {live ? (
              <p className="font-mono text-callout font-bold tabular-nums text-verde-deep">
                {live.lat.toFixed(5)}, {live.lng.toFixed(5)}{" "}
                <span className="font-sans text-footnote font-normal">~{Math.round(live.accuracyM)} m</span>
              </p>
            ) : (
              <p className="text-callout text-verde-deep">Getting a fix…</p>
            )}
            <p className="mt-1 text-footnote text-verde-deep/80">
              {lastSentAt ? `Last sent ${formatClock(lastSentAt)}` : "First auto check-in sends once a fix lands."}
            </p>
          </div>
        ) : null}

        {error ? <p className="mt-3 text-callout font-medium text-danger">{error}</p> : null}

        <p className="mt-3 text-footnote text-secondary">
          Tracking pauses when the screen locks or you leave the app — iPhone doesn't allow web apps
          to track in the background.
        </p>
      </div>
    </>
  );
}
