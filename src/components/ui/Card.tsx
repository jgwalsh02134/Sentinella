import type { ReactNode } from "react";

/**
 * The one card: white surface, 1px border, 16px radius, 16px padding.
 * No shadow — elevation by shadow belongs to the 112 plate alone.
 *
 * `accentEdge` adds the 3px accent-colored left edge used for category
 * liveries (guide tabs, prepare sections); the hue comes from the nearest
 * data-accent ancestor, and the section label always carries the meaning.
 */
export default function Card({
  as: Tag = "div",
  accentEdge = false,
  padded = true,
  id,
  className = "",
  children,
}: {
  as?: "div" | "article" | "section" | "li";
  accentEdge?: boolean;
  /** false for grouped lists that manage their own row padding. */
  padded?: boolean;
  /** Anchor id — guide search deep-links to individual cards. */
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      id={id}
      className={`plate border border-default bg-card ${padded ? "p-4" : ""} ${
        accentEdge ? "accent-edge" : ""
      } ${className}`}
    >
      {children}
    </Tag>
  );
}
