"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { FieldError } from "@/components/ui/Field";
import { saveLastFix } from "@/lib/lastFix";

type Fix = {
  lat: number;
  lng: number;
  accuracyM: number;
  at: Date;
};

function mapsUrl(fix: Fix) {
  return `https://maps.google.com/?q=${fix.lat.toFixed(6)},${fix.lng.toFixed(6)}`;
}

function buildMessage(fix: Fix) {
  const when = fix.at.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  });
  return `My location: ${mapsUrl(fix)} (accurate to ~${Math.round(fix.accuracyM)} m, as of ${when}).`;
}

export default function ShareLocation() {
  const [fix, setFix] = useState<Fix | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function locate() {
    setError(null);
    setCopied(false);
    if (!("geolocation" in navigator)) {
      setError("This device doesn't expose location to the browser.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFix({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: pos.coords.accuracy,
          at: new Date(),
        });
        saveLastFix(pos.coords.latitude, pos.coords.longitude);
        setBusy(false);
      },
      (err) => {
        setBusy(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission was denied. Enable it in your browser settings to use this."
            : "Couldn't get a position fix. Move toward open sky and try again.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  }

  async function share() {
    if (!fix) return;
    const text = buildMessage(fix);
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // fall through to clipboard if the user cancels or share fails
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setError("Couldn't open the share sheet or copy. Long-press the coordinates to copy manually.");
    }
  }

  return (
    <Card>
      <h2 className="text-headline">Your position</h2>
      <p className="mt-2 text-body text-secondary">
        Read your coordinates to a 112 operator, or send them to a contact.
      </p>

      {fix ? (
        <div className="mt-3 break-words rounded-xl bg-sunken p-4">
          <p className="font-mono text-title font-bold tabular-nums text-primary">
            {fix.lat.toFixed(5)}, {fix.lng.toFixed(5)}
          </p>
          <p className="mt-1 text-footnote text-secondary">
            Accurate to ~{Math.round(fix.accuracyM)} m ·{" "}
            <a href={mapsUrl(fix)} target="_blank" rel="noreferrer" className="text-link">
              Open in Maps
            </a>
          </p>
        </div>
      ) : null}

      {error ? <FieldError className="mt-3">{error}</FieldError> : null}
      {copied ? (
        <p className="mt-3 text-callout font-semibold text-success" role="status">
          Copied — paste it anywhere.
        </p>
      ) : null}

      <div className="mt-3 flex gap-3">
        <Button
          variant={fix ? "tinted" : "filled"}
          size="md"
          onClick={locate}
          disabled={busy}
          className="min-w-0 flex-1"
        >
          {busy ? "Locating…" : fix ? "Refresh position" : "Get my position"}
        </Button>
        {fix ? (
          <Button variant="filled" size="md" onClick={() => void share()} className="min-w-0 flex-1">
            Share position
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
