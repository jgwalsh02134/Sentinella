import { Bell, BookOpen, Map, MapPin, Phone, Plane } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Icon from "@/components/Icon";

/**
 * iOS Settings-style navigation tile: a 29pt rounded square (7pt radius)
 * in the feature's color with an SF-style glyph. The color follows the
 * user — the same tile marks the row on Home and the destination screen's
 * header, so wayfinding is continuous.
 *
 * THE NAVIGATION COLOR MAP (one color = one feature; documented in
 * .cursorrules — change it there and here together):
 *
 *   emergency  RED     phone      (permitted: an emergency affordance)
 *   checkin    GREEN   pin
 *   map        BLUE    map
 *   guide      ORANGE  book       (dark glyph — white fails contrast on orange)
 *   prepare    INDIGO  plane
 *   alerts     TEAL    bell
 *
 * Color is never the sole signal: every tile ships next to its label.
 * These iOS colors mark wayfinding only — they are not button colors and
 * never make an action red (signal fills stay emergency-only).
 */

export type FeatureKey = "emergency" | "checkin" | "map" | "guide" | "prepare" | "alerts";

const TILES: Record<FeatureKey, { classes: string; icon: LucideIcon }> = {
  emergency: { classes: "bg-ios-red text-white", icon: Phone },
  checkin: { classes: "bg-ios-green text-white", icon: MapPin },
  map: { classes: "bg-ios-blue text-white", icon: Map },
  // Yellow/orange tiles take dark glyphs: white on #FF9500 is ~2.1:1.
  guide: { classes: "bg-ios-orange text-neutral-950", icon: BookOpen },
  prepare: { classes: "bg-ios-indigo text-white", icon: Plane },
  alerts: { classes: "bg-ios-teal text-white", icon: Bell },
};

export default function NavTile({
  feature,
  className = "",
}: {
  feature: FeatureKey;
  className?: string;
}) {
  const tile = TILES[feature];
  return (
    <span
      aria-hidden="true"
      className={`flex h-tile w-tile shrink-0 items-center justify-center rounded-tile ${tile.classes} ${className}`}
    >
      <Icon icon={tile.icon} size="sm" />
    </span>
  );
}
