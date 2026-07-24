"use client";

import type { MouseEvent } from "react";

/**
 * The one iOS-style toggle. All geometry is DERIVED from the constants
 * below — the thumb's ON offset is computed (track − thumb − inset), so
 * the thumb is mathematically incapable of leaving the track. Never
 * reintroduce a hardcoded translate utility here; that's the drift that
 * caused the misaligned-toggle bug class.
 *
 * Semantics: a real <button role="switch" aria-checked>, not a styled
 * checkbox. Name it via labelledBy (preferred — point at the visible row
 * title's id) or label (aria-label fallback). Clicks stop propagating,
 * so a whole row may also toggle it with its own onClick — single event,
 * no double-fire. Space/Enter toggle natively; the global focus-visible
 * ring applies.
 *
 * Layout contract: the switch is a fixed-size flex-none item that
 * self-centers in its row — flex can never stretch or shrink it.
 */

const TRACK_W = 51;
const TRACK_H = 31;
const THUMB = 27;
const INSET = 2;
/** ON position: 51 − 27 − 2 = 22px. Derived, never hardcoded. */
const ON_X = TRACK_W - THUMB - INSET;
const OFF_X = INSET;
/** Vertical padding lifts the 31px track to a ≥44px hit area. */
const HIT_PAD_Y = (44 - TRACK_H) / 2;

/** Control affordance shadow (iOS thumb) — deliberately outside the
 *  card-elevation system, which reserves shadow-plate for the 112 plate. */
const THUMB_SHADOW = "0 3px 8px rgba(0, 0, 0, 0.15), 0 1px 1px rgba(0, 0, 0, 0.06)";

export default function Switch({
  checked,
  onChange,
  label,
  labelledBy,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Accessible name when no visible title carries it (aria-label). */
  label?: string;
  /** id of the visible row title — preferred over label. */
  labelledBy?: string;
  disabled?: boolean;
}) {
  function handleClick(ev: MouseEvent<HTMLButtonElement>) {
    // A row-level onClick may also toggle; this keeps it a single event.
    ev.stopPropagation();
    onChange(!checked);
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      disabled={disabled}
      onClick={handleClick}
      className="flex-none self-center rounded-full"
      style={{ padding: `${HIT_PAD_Y}px 2px` }}
    >
      <span
        aria-hidden="true"
        className={`relative block transition-colors duration-200 ease-out motion-reduce:transition-none ${
          checked ? "bg-verde" : "bg-neutral-300"
        } ${disabled ? "saturate-50" : ""}`}
        style={{ width: TRACK_W, height: TRACK_H, borderRadius: TRACK_H / 2 }}
      >
        <span
          className={`absolute left-0 rounded-full transition-transform duration-200 ease-out motion-reduce:transition-none ${
            disabled ? "bg-neutral-100" : "bg-neutral-0"
          }`}
          style={{
            width: THUMB,
            height: THUMB,
            top: INSET,
            transform: `translateX(${checked ? ON_X : OFF_X}px)`,
            boxShadow: THUMB_SHADOW,
          }}
        />
      </span>
    </button>
  );
}
