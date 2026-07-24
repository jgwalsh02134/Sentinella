import Icon from "@/components/Icon";
import { guideSection, type GuideSlug } from "@/lib/guideSections";

/**
 * The guide's section marker: same 29pt tile anatomy as NavTile, but
 * colored through the accent slot so each section keeps its .cursorrules
 * livery (scams=terracotta, phrases=glicine, …). Color is never the only
 * signal — the tile always ships beside its label.
 */
export default function GuideTile({
  slug,
  className = "",
}: {
  slug: GuideSlug;
  className?: string;
}) {
  const section = guideSection(slug);
  return (
    <span
      aria-hidden="true"
      data-accent={section.accent}
      className={`flex h-tile w-tile shrink-0 items-center justify-center rounded-tile bg-accent text-on-accent ${className}`}
    >
      <Icon icon={section.icon} size="sm" />
    </span>
  );
}
