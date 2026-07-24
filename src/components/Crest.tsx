import Image from "next/image";

/**
 * The Sentinella heraldic crest. Source of truth is the transparent PNG at
 * public/brand/crest.png (no vector master exists); the component renders
 * the small crest-ui.png rendition, which `npm run icons` regenerates and
 * the service worker precaches so branding survives offline. Served
 * unoptimized on purpose — a fixed /brand URL is cacheable, while
 * /_next/image URLs are not reliably precacheable.
 *
 * Placement rule: the crest brands calm surfaces (headers, auth forms, the
 * footer). It never goes on emergency CallPlates or the offline page —
 * those stay pure signage for instant recognition.
 */
const ASPECT = 131 / 160;

export default function Crest({
  size = 40,
  className = "",
  priority = false,
  decorative = false,
}: {
  /** Rendered height in px. */
  size?: number;
  className?: string;
  priority?: boolean;
  /**
   * True for repeat placements (the footer): empty alt + aria-hidden so
   * screen readers don't announce "Sentinella crest" twice per page. The
   * header crest stays meaningful.
   */
  decorative?: boolean;
}) {
  return (
    <Image
      src="/brand/crest-ui.png"
      alt={decorative ? "" : "Sentinella crest"}
      aria-hidden={decorative || undefined}
      width={Math.round(size * ASPECT)}
      height={size}
      priority={priority}
      unoptimized
      className={className}
    />
  );
}
