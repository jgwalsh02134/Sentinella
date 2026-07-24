import type { ReactNode } from "react";

/**
 * The one shared "verified — re-verify before travel" caveat (.cursorrules
 * rule 7). Always placed at the end of the section whose data it covers,
 * always the same quiet footnote voice with a bold action clause:
 *
 *   {children} — **{action}**
 */
export default function VerifiedCaveat({
  children,
  action = "verify against official sources before travel.",
  className = "mt-3",
}: {
  /** Leading clause, e.g. "Support numbers verified July 2026". */
  children: ReactNode;
  /** Bold imperative that ends the caveat. */
  action?: string;
  className?: string;
}) {
  return (
    <p className={`${className} text-footnote text-secondary`}>
      {children} — <strong className="font-bold">{action}</strong>
    </p>
  );
}
