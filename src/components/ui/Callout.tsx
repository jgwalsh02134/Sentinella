import type { ReactNode } from "react";

/**
 * THE caveat pattern — ambra tint, 3px left border. Warnings, data-quality
 * caveats ("verified July 2026 — recheck before travel"), and must-not-miss
 * notes all use this one shape, at most one per section. Never signal red:
 * red is for emergency actions, not sentences.
 */
export default function Callout({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="note" className={`callout ${className}`}>
      {children}
    </div>
  );
}
