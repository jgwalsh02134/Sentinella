"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

/**
 * "Get Sentinella on your home screen" card.
 *
 * iOS Safari cannot trigger an install prompt from a link, so we show the
 * two manual steps with unmistakable glyphs. On Chromium browsers we
 * capture beforeinstallprompt and swap the steps for a real Install
 * button. Never shown when the app is already running standalone.
 *
 * Dismissal persists in-memory and via a cookie — localStorage is
 * unreliable in some iOS webview/private contexts.
 */

const DISMISS_COOKIE = "sentinella-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function runningStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's non-standard flag, set when launched from the home screen.
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function dismissedByCookie(): boolean {
  return document.cookie.split("; ").some((c) => c === `${DISMISS_COOKIE}=1`);
}

/** The iOS share glyph: a box with an arrow rising out of it. */
function ShareGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="inline-block h-[1.1em] w-[1.1em] align-[-0.15em]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 14V3.5" />
      <path d="m8.5 7 3.5-3.5L15.5 7" />
      <path d="M8 10.5H6.5A1.5 1.5 0 0 0 5 12v7a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-7a1.5 1.5 0 0 0-1.5-1.5H16" />
    </svg>
  );
}

/** The Add to Home Screen glyph: a rounded square with a plus. */
function AddGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="inline-block h-[1.1em] w-[1.1em] align-[-0.15em]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M12 8.5v7" />
      <path d="M8.5 12h7" />
    </svg>
  );
}

export default function InstallGuide() {
  const [visible, setVisible] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (runningStandalone() || dismissedByCookie()) return;
    setVisible(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setVisible(false);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    const halfYear = 60 * 60 * 24 * 180;
    document.cookie = `${DISMISS_COOKIE}=1; max-age=${halfYear}; path=/; samesite=lax`;
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    setInstallEvent(null);
    if (outcome === "accepted") setVisible(false);
  }

  if (!visible) return null;

  return (
    <section className="mt-6" aria-label="Add to home screen">
      <Card className="relative">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install suggestion"
          className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-xl text-secondary"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>

        <h2 className="pr-10 text-headline">Get Sentinella on your home screen</h2>
        <p className="mt-2 pr-10 text-subhead text-secondary">
          Installed, it opens full screen, keeps working offline, and stays one tap from 112.
        </p>

        {installEvent ? (
          <Button
            variant="secondary"
            size="lg"
            onClick={() => void install()}
            className="mt-3 w-full"
          >
            Install app
          </Button>
        ) : (
          <ol className="mt-3 space-y-2">
            <li className="flex gap-3 text-body">
              <span className="font-mono font-bold text-verde">1</span>
              <span className="min-w-0 text-secondary">
                Tap the <strong className="whitespace-nowrap text-primary">Share <ShareGlyph /></strong>{" "}
                button in Safari&apos;s toolbar.
              </span>
            </li>
            <li className="flex gap-3 text-body">
              <span className="font-mono font-bold text-verde">2</span>
              <span className="min-w-0 text-secondary">
                Choose{" "}
                <strong className="text-primary">
                  Add to Home&nbsp;Screen&nbsp;<AddGlyph />
                </strong>
                .
              </span>
            </li>
          </ol>
        )}
      </Card>
    </section>
  );
}
