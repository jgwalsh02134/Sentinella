"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { FieldError } from "@/components/ui/Field";

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
    <Card>
      <h2 className="text-headline">Share with family</h2>
      <p className="mt-2 text-subhead text-secondary">
        A private link that shows your latest check-in status and approximate area — never exact
        coordinates. Anyone with the link can view it; revoke it any time.
      </p>

      {url ? (
        <>
          <p className="text-link mt-2 break-all text-footnote">{url}</p>
          <div className="mt-3 flex gap-3">
            <Button
              variant="tinted"
              size="md"
              onClick={() => void shareOrCopy(url)}
              disabled={busy}
              className="min-w-0 flex-1"
            >
              {copied ? "Copied" : "Share link"}
            </Button>
            <Button
              variant="tinted" destructive
              size="md"
              onClick={() => void revoke()}
              disabled={busy}
              className="min-w-0 flex-1"
            >
              Revoke link
            </Button>
          </div>
        </>
      ) : (
        <Button
          variant="tinted"
          size="md"
          onClick={() => void create()}
          disabled={busy}
          className="mt-3 w-full"
        >
          {busy ? "Creating…" : "Create share link"}
        </Button>
      )}

      {error ? <FieldError className="mt-2">{error}</FieldError> : null}
    </Card>
  );
}
