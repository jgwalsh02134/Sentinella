import { Globe, Navigation, Phone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import Icon from "@/components/Icon";
import Button from "@/components/ui/Button";

/**
 * The Call / Directions / Website triplet used by embassies, hospitals,
 * and map places — an equal TINTED row; at 320px viewports the flex
 * basis makes the row wrap 2+1 instead of squeezing labels.
 *
 * Labels say exactly what they do and stay identical everywhere:
 * "Call", "Directions", "Website" — and each standard label carries its
 * matching glyph automatically (same 16px size, gap, and weight), so the
 * triplet cannot drift apart per call site. Directions buttons are
 * destination-agnostic UI: Navigation icon, never a brand mark, even
 * though the link opens Apple Maps.
 */
const LABEL_GLYPHS: Record<string, LucideIcon> = {
  Call: Phone,
  Directions: Navigation,
  Website: Globe,
};

export type Action = {
  label: string;
  href: string;
  /** Custom leading glyph for non-standard labels; the standard triplet
      labels get theirs automatically. */
  icon?: ReactNode;
};

export default function ActionRow({
  actions,
  className = "",
}: {
  actions: Action[];
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {actions.map((action) => {
        const standard = LABEL_GLYPHS[action.label];
        // shrink-0: in a tight flex button the svg would otherwise absorb
        // all the shrink and collapse; the row wraps 2+1 instead.
        const glyph =
          action.icon ?? (standard ? <Icon icon={standard} size="sm" className="shrink-0" /> : null);
        return (
          <Button
            key={action.href + action.label}
            href={action.href}
            variant="tinted"
            size="md"
            className="min-w-0 flex-1 basis-24"
          >
            {glyph}
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}
