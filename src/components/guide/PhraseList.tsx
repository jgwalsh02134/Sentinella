"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, X } from "lucide-react";
import Icon from "@/components/Icon";
import ItalyFlag from "@/components/ItalyFlag";
import { guideAnchor } from "@/lib/guideSections";
import { phraseGroups, type Phrase } from "@/data/phrases";

/**
 * Phrase rows + Show mode. Tapping a phrase opens a full-screen overlay
 * with the Italian at maximum size — the purpose is handing the phone to
 * an Italian. Fully offline (bundled data, no fetches); the overlay traps
 * focus, closes on Esc or swipe-down, and restores focus on close.
 */
export default function PhraseList() {
  const [open, setOpen] = useState<Phrase | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const touchStartY = useRef<number | null>(null);

  function show(p: Phrase, trigger: HTMLElement) {
    triggerRef.current = trigger;
    setOpen(p);
  }

  function close() {
    setOpen(null);
    triggerRef.current?.focus();
  }

  // Scroll lock + focus trap while the overlay is up. The close button is
  // the overlay's only focusable element, so the trap is: keep focus there.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(ev: KeyboardEvent) {
      if (ev.key === "Escape") {
        ev.preventDefault();
        close();
      } else if (ev.key === "Tab") {
        ev.preventDefault();
        closeRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      {phraseGroups.map((group) => (
        <section key={group.label} aria-label={group.label} className="mt-5">
          <h2 className="text-headline">{group.label}</h2>
          <div className="mt-2 space-y-2">
            {group.phrases.map((p) => (
              <button
                key={p.it}
                type="button"
                id={guideAnchor(p.en)}
                onClick={(ev) => show(p, ev.currentTarget)}
                aria-label={`${p.en} — ${p.it}. Show full screen.`}
                className="guide-item plate accent-edge block w-full scroll-mt-4 border border-default bg-card p-4 text-left active:bg-sunken"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-caption font-semibold uppercase tracking-wide text-secondary">
                      {p.en}
                    </span>
                    <span className="mt-1 block text-title text-accent-deep">
                      <ItalyFlag /> <i lang="it">{p.it}</i>
                    </span>
                    <span className="mt-1 block text-subhead italic text-secondary">{p.say}</span>
                  </span>
                  <span aria-hidden="true" className="mt-1 shrink-0 text-tertiary">
                    <Icon icon={Maximize2} size="sm" />
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${open.en} — Italian phrase, full screen`}
          className="fixed inset-0 z-50 flex flex-col bg-card px-6 pb-6"
          style={{
            paddingTop: "max(1rem, env(safe-area-inset-top))",
            paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
          }}
          onPointerDown={(ev) => {
            touchStartY.current = ev.clientY;
          }}
          onPointerUp={(ev) => {
            if (touchStartY.current !== null && ev.clientY - touchStartY.current > 80) close();
            touchStartY.current = null;
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 text-subhead font-semibold text-secondary">{open.en}</p>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Close"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sunken text-primary"
            >
              <Icon icon={X} size="md" />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto text-center">
            {/* Sized by viewport width, wraps freely — the longest phrase
                fits at 320px without truncation. */}
            <p
              lang="it"
              className="max-w-full break-words font-bold text-primary"
              style={{ fontSize: "clamp(2.25rem, 12vw, 4.5rem)", lineHeight: 1.15 }}
            >
              {open.it}
            </p>
            <p className="mt-5 text-title italic text-secondary">{open.say}</p>
          </div>
          <p className="text-center text-footnote text-tertiary">Swipe down or press Esc to close</p>
        </div>
      ) : null}
    </>
  );
}
