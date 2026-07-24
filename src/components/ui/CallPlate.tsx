import type { ReactNode } from "react";

/**
 * The app's signature element: emergency numbers rendered like Italian
 * road signage — high contrast, huge numerals, zero decoration. The
 * entire plate is a tel: link; one tap to call.
 *
 * Pure signage on purpose: number, name, Italian name — NOTHING else
 * inside the tap target. Explanatory prose goes in the `footnote` prop,
 * which renders below the plate, outside the tappable area.
 *
 * Color is language here:
 *   red   = the primary emergency action (112 only) — and it carries the
 *           app's ONLY shadow, so it is physically the deepest element
 *           on any screen
 *   green = other official emergency services
 *   white = support lines
 */
type CallPlateProps = {
  number: string;
  dial: string;
  name: string;
  nameIt?: string;
  tier?: "primary" | "service" | "support";
  /** Explanatory sentence rendered BELOW the plate, never inside it. */
  footnote?: ReactNode;
};

const tierStyles: Record<NonNullable<CallPlateProps["tier"]>, string> = {
  primary: "bg-signal text-white shadow-plate active:bg-signal-deep",
  service: "bg-verde text-white active:bg-verde-deep",
  support: "bg-white text-ink border border-line active:bg-paper",
};

export default function CallPlate({
  number,
  dial,
  name,
  nameIt,
  tier = "service",
  footnote,
}: CallPlateProps) {
  const isPrimary = tier === "primary";
  const isSupport = tier === "support";

  const plate = (
    <a
      href={`tel:${dial}`}
      aria-label={`Call ${name} at ${number}`}
      className={`plate ${tierStyles[tier]} p-5 transition-transform duration-150 ease-out active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100`}
    >
      <span className="flex flex-wrap items-center gap-4">
        <span
          className={`font-mono font-bold tracking-tight ${
            isPrimary ? "text-numeral-lg" : "text-numeral"
          } ${isSupport ? "text-verde" : ""} tabular-nums`}
        >
          {number}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block ${isPrimary ? "text-title" : "text-headline"}`}>{name}</span>
          {nameIt ? (
            <i
              lang="it"
              className={`block text-subhead italic ${isSupport ? "text-mist" : "text-white/75"}`}
            >
              {nameIt}
            </i>
          ) : null}
        </span>
        <svg
          viewBox="0 0 24 24"
          className={`h-6 w-6 shrink-0 ${isSupport ? "text-verde" : "text-white/90"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      </span>
    </a>
  );

  if (!footnote) return plate;

  return (
    <div>
      {plate}
      <p className="mt-2 px-1 text-footnote text-secondary">{footnote}</p>
    </div>
  );
}
