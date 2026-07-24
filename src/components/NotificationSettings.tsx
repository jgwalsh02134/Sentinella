"use client";

import { useEffect, useState } from "react";

type Preferences = {
  notifyOfficial: boolean;
  notifyTeam: boolean;
  notifyReminders: boolean;
};

const PREF_LABELS: Array<{ key: keyof Preferences; label: string; detail: string }> = [
  { key: "notifyOfficial", label: "Official advisories", detail: "New State Department and embassy notices" },
  { key: "notifyTeam", label: "Team alerts", detail: "Alerts your admins publish" },
  { key: "notifyReminders", label: "Check-in reminders", detail: "Nudges when you're overdue to check in" },
];

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export default function NotificationSettings() {
  const [supported, setSupported] = useState(true);
  const [needsInstall, setNeedsInstall] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // iOS Safari in a plain tab cannot receive push at all — show install
    // guidance instead of a permission button that cannot work.
    if (isIos() && !isStandalone()) {
      setNeedsInstall(true);
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setSupported(false);
      return;
    }

    fetch("/api/push/subscribe")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
      .then(async (data) => {
        if (cancelled) return;
        setPublicKey(data.publicKey);
        setPrefs(data.preferences);
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        if (!cancelled) setEnabled(!!sub);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) throw new Error("Notifications need the installed app or a production build.");

      if (enabled) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
        setEnabled(false);
        return;
      }

      if (!publicKey) throw new Error("Notifications aren't configured on the server yet.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Notifications are blocked. Allow them in your browser settings.");
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint, keys: json.keys }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Couldn't save the subscription.");
      }
      setEnabled(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't work. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function setPref(key: keyof Preferences, value: boolean) {
    if (!prefs) return;
    const prev = prefs;
    setPrefs({ ...prefs, [key]: value });
    const res = await fetch("/api/push/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    }).catch(() => null);
    if (!res?.ok) setPrefs(prev);
  }

  if (needsInstall) {
    // iOS Safari in a browser tab cannot receive push — don't show a
    // permission button that cannot work. The install card on this screen
    // (InstallGuide) walks through Share → Add to Home Screen.
    return (
      <div className="plate border border-default bg-card p-4">
        <h2 className="text-headline">Notifications</h2>
        <p className="mt-1 text-subhead text-secondary">
          On iPhone, notifications need iOS 16.4 or later <em>and</em> Sentinella installed to your
          home screen — Safari tabs can't receive them. Install first (Safari:{" "}
          <strong className="font-bold text-primary">Share → Add to Home Screen</strong>, steps in the
          card below), then turn notifications on from the installed app.
        </p>
      </div>
    );
  }

  if (!supported) {
    return (
      <div className="plate border border-default bg-card p-4">
        <h2 className="text-headline">Notifications</h2>
        <p className="mt-1 text-subhead text-secondary">
          This browser doesn't support push notifications.
        </p>
      </div>
    );
  }

  return (
    <div className="plate border border-default bg-card p-4">
      <div className="flex min-h-[2.75rem] items-center gap-3">
        <div className="flex-1">
          <h2 className="text-headline">Notifications</h2>
          <p className="text-footnote text-secondary">
            {enabled ? "On for this device." : "Alerts and reminders, even with the app closed."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Notifications"
          disabled={busy}
          onClick={() => void toggle()}
          className="flex h-11 w-14 shrink-0 items-center justify-center rounded-lg disabled:border-neutral-300 disabled:text-tertiary"
        >
          <span
            aria-hidden="true"
            className={`relative h-8 w-[3.25rem] rounded-full transition-colors motion-reduce:transition-none ${enabled ? "bg-verde" : "bg-line"}`}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-card shadow transition-transform motion-reduce:transition-none ${enabled ? "translate-x-[1.5rem]" : "translate-x-1"}`}
            />
          </span>
        </button>
      </div>

      {error ? <p className="mt-2 text-callout font-medium text-danger">{error}</p> : null}

      {enabled && prefs ? (
        <div className="mt-3 space-y-1 border-t border-default pt-3">
          {PREF_LABELS.map(({ key, label, detail }) => (
            <label key={key} className="flex min-h-[2.75rem] cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={(e) => void setPref(key, e.target.checked)}
                className="h-5 w-5 shrink-0 accent-verde"
              />
              <span>
                <span className="block text-callout font-semibold">{label}</span>
                <span className="block text-footnote text-secondary">{detail}</span>
              </span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
