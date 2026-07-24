import type { LucideIcon } from "lucide-react";

/**
 * The one way icons enter this UI. Standardizes size, stroke, color, and
 * accessibility so every screen reads the same:
 *
 * - color is always currentColor — set the text token (text-mist,
 *   text-verde, text-ink) on the surrounding element, never a literal hex
 *   on the icon. Signal red only inside genuine emergency components.
 * - every icon is aria-hidden; the adjacent text or the parent control's
 *   aria-label carries the meaning. An icon is never the sole conveyor.
 * - sizes sm/md inline with text, lg in cards and headers.
 */

type IconSize = "sm" | "md" | "lg";

const SIZE_PX: Record<IconSize, number> = { sm: 16, md: 20, lg: 24 };

export default function Icon({
  icon: Glyph,
  size = "md",
  className,
}: {
  icon: LucideIcon;
  size?: IconSize;
  className?: string;
}) {
  return (
    <Glyph
      size={SIZE_PX[size]}
      // Small icons need a slightly heavier stroke to stay legible.
      strokeWidth={size === "sm" ? 2.25 : 2}
      color="currentColor"
      aria-hidden="true"
      className={className}
    />
  );
}
