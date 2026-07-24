import Link from "next/link";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import Icon from "@/components/Icon";

/**
 * One tappable row: icon + text + trailing chevron/value. The WHOLE row is
 * the tap target, minimum 52px tall. Renders as a card by itself, or flush
 * (card={false}) inside a grouped Card with divide-y.
 *
 * Trailing glyph is chosen from the destination: internal links get a
 * chevron, external links get the outward arrow, buttons get whatever the
 * caller passes via `value`.
 */
type ListRowProps = {
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Trailing text (a size, a count) shown before the glyph. */
  value?: ReactNode;
  /** Standalone card chrome (default) vs flush row inside a group. */
  card?: boolean;
  className?: string;
  "aria-label"?: string;
};

function TrailingGlyph({ external }: { external: boolean }) {
  return (
    <span className="shrink-0 text-tertiary">
      <Icon icon={external ? ArrowUpRight : ChevronRight} size="md" />
    </span>
  );
}

export default function ListRow({
  href,
  onClick,
  icon,
  title,
  subtitle,
  value,
  card = true,
  className = "",
  "aria-label": ariaLabel,
}: ListRowProps) {
  const chrome = card ? "plate border border-default bg-card" : "";
  const classes = `flex min-h-control-lg w-full items-center gap-3 px-4 py-2 text-left ${chrome} ${className}`;

  const external = !!href && /^https?:/.test(href);
  const body = (
    <>
      {icon ? <span className="shrink-0 text-icon-brand">{icon}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="block break-words text-headline">{title}</span>
        {subtitle ? (
          <span className="block text-footnote text-secondary">{subtitle}</span>
        ) : null}
      </span>
      {value ? (
        <span className="shrink-0 text-subhead tabular-nums text-secondary">{value}</span>
      ) : null}
      {href ? <TrailingGlyph external={external} /> : null}
    </>
  );

  if (href?.startsWith("/")) {
    return (
      <Link href={href} prefetch={false} aria-label={ariaLabel} className={classes}>
        {body}
      </Link>
    );
  }
  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        aria-label={ariaLabel}
        className={classes}
      >
        {body}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-label={ariaLabel} className={classes}>
        {body}
      </button>
    );
  }
  return <div className={classes}>{body}</div>;
}
