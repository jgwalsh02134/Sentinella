import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import Icon from "@/components/Icon";

/**
 * One row of the guide's inset-grouped lists (same anatomy as Home's
 * navigation rows): color tile + title + descriptor + count + chevron,
 * whole row tappable, hairline separator inset to the text edge.
 * Render inside <GuideRowGroup>.
 */
export function GuideRow({
  href,
  tile,
  title,
  subtitle,
  value,
}: {
  href: string;
  tile: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  value?: ReactNode;
}) {
  return (
    <li className="group">
      <Link
        href={href}
        prefetch={false}
        className="flex min-h-control-lg items-center gap-3 pl-4 active:bg-sunken"
      >
        {tile}
        <span className="flex min-w-0 flex-1 items-center justify-between gap-3 self-stretch border-t border-separator py-2 pr-3 group-first:border-t-0">
          <span className="min-w-0">
            <span className="block break-words text-body">{title}</span>
            {subtitle ? (
              <span className="block break-words text-footnote text-secondary">{subtitle}</span>
            ) : null}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {value ? (
              <span className="text-subhead tabular-nums text-secondary">{value}</span>
            ) : null}
            <span className="text-tertiary">
              <Icon icon={ChevronRight} size="md" />
            </span>
          </span>
        </span>
      </Link>
    </li>
  );
}

/** The inset-grouped card the rows sit in. */
export function GuideRowGroup({
  children,
  className = "",
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <ul aria-label={ariaLabel} className={`plate overflow-hidden border border-default bg-card ${className}`}>
      {children}
    </ul>
  );
}
