/**
 * Loading placeholders. The shimmer lives in globals.css (.skeleton) and
 * collapses to a static block under prefers-reduced-motion.
 *
 * Skeleton is a single shimmering block; SkeletonCard is the card-shaped
 * preset used while lists and teasers load. Screen readers hear one polite
 * "Loading" per surface, not a pile of divs.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

export function SkeletonCard({
  lines = 2,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`plate border border-default bg-card p-4 ${className}`}
    >
      <Skeleton className="h-4 w-20" />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={`mt-3 h-4 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}
