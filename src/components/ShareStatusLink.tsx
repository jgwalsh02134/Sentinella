"use client";

import { useEffect, useState } from "react";

/**
 * "Share with family": one revocable public link to /status/<token>
 * showing the latest check-in — coarse place only, no coordinates.
 */
export default function ShareStatusLink() {
  const [url, setUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/share")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
      .then((data) => {
        if (!cancelled) setUrl(data.url);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function shareOrCopy(link: string) {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My travel status",
          text: "Follow my check-ins while I'm in Italy:",
          url: link,
        });
        return;
      } catch {
        // User cancelled the sheet — fall through to clipboard.
      }
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setError("Couldn't copy. Long-press the link to copy it manually.");
    }
  }

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/share", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't create the link.");
      setUrl(data.url);
      await shareOrCopy(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the link. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/share", { method: "DELETE" });
      if (!res.ok) throw new Error("Couldn't revoke the link.");
      setUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't revoke the link. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return null;

  return (
    <div className="plate border border-default bg-card p-5">
      <h2 className="text-sm font-bold">Share with family</h2>
      <p className="mt-1 text-xs leading-relaxed text-secondary">
        A private link that shows your latest check-in status and approximate area — never exact
        coordinates. Anyone with the link can view it; revoke it any time.
      </p>

      {url ? (
        <>
          <p className="text-link mt-2 break-all text-xs">{url}</p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => void shareOrCopy(url)}
              disabled={busy}
              className="min-h-[2.75rem] flex-1 rounded-xl bg-brand font-semibold text-on-accent active:bg-brand-strong disabled:bg-sunken disabled:text-tertiary"
            >
              {copied ? "Copied" : "Share link"}
            </button>
            <button
              type="button"
              onClick={() => void revoke()}
              disabled={busy}
              className="min-h-[2.75rem] flex-1 rounded-xl border-2 border-strong font-semibold text-secondary active:bg-sunken disabled:border-neutral-300 disabled:text-tertiary"
            >
              Revoke link
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => void create()}
          disabled={busy}
          className="mt-3 min-h-[2.75rem] w-full rounded-xl border-2 border-accent font-semibold text-accent active:bg-accent-subtle disabled:border-neutral-300 disabled:text-tertiary"
        >
          {busy ? "Creating…" : "Create share link"}
        </button>
      )}

      {error ? <p className="mt-2 text-sm font-medium text-danger">{error}</p> : null}
    </div>
  );
}
