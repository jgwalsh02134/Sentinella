import type { ReactNode } from "react";

/**
 * Status chip: tinted fill + deep text, never a solid. Color is never the
 * only signal — the label is the meaning; the tint just speeds it up.
 *
 *   info      azzurro — informational, official sources
 *   caution   ambra — the middle severity ("advisory" severity displays
 *             as "Caution"; the word advisory is reserved for government
 *             guidance)
 *   critical  signal tint + danger text (a notice about danger is not an
 *             emergency ACTION, so no solid red)
 *   success   verde — all clear
 *   neutral   outlined, for metadata chips (regions, "Auto")
 */
type Tone = "info" | "caution" | "critical" | "success" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  info: "bg-info-subtle text-info",
  caution: "bg-warning-subtle text-warning",
  critical: "bg-danger-subtle text-danger",
  success: "bg-success-subtle text-success",
  neutral: "border border-default text-secondary",
};

export default function Badge({
  tone = "neutral",
  className = "",
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-caption font-bold uppercase tracking-wide ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
