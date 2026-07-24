import type { ReactNode } from "react";

/**
 * Eyebrow + real heading + optional trailing action. Every eyebrow in the
 * app is paired with a heading through this component — a floating
 * micro-label with no heading is impossible by construction.
 *
 * Rhythm: eyebrow→heading 4px (mt-1), heading→intro 8px (mt-2).
 */
export default function SectionHeader({
  eyebrow,
  title,
  intro,
  action,
  tile,
  level = 2,
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  /** Optional one-liner under the heading (page headers mostly). */
  intro?: ReactNode;
  /** Trailing slot, top-aligned with the heading. */
  action?: ReactNode;
  /** Section marker: the destination's NavTile beside the h1, so the
      color the user tapped on Home follows them here. */
  tile?: ReactNode;
  /** 1 for the page h1 (exactly one per screen), 2+ for sections. */
  level?: 1 | 2 | 3;
  className?: string;
}) {
  const Tag = `h${level}` as "h1" | "h2" | "h3";
  const titleClass = level === 1 ? "title-page" : "title-section";

  return (
    <header className={className}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {tile ? <span className="shrink-0">{tile}</span> : null}
          <div className="min-w-0">
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <Tag className={`${titleClass} ${eyebrow ? "mt-1" : ""}`}>{title}</Tag>
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {intro ? <p className="body-copy mt-2 text-secondary">{intro}</p> : null}
    </header>
  );
}
