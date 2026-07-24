import Image from "next/image";

/**
 * Seal of the U.S. Department of State (public-domain, Wikimedia
 * Commons; optimized local copy at public/brand/us-state-seal.svg —
 * precached by the service worker, so it renders offline).
 *
 * USAGE RULE: the seal identifies official U.S. government resources
 * ONLY — the "U.S. citizens" section header and the Overseas Citizens
 * Services card on the Emergency screen. Never in the app header, nav,
 * or any non-government context.
 *
 * Fixed at 24px with an absolute 28px cap (px, not rem/em, so Dynamic
 * Type never inflates the emblem into artwork).
 */
export default function SealBadge({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/brand/us-state-seal.svg"
      alt="U.S. Department of State seal"
      width={24}
      height={24}
      unoptimized
      className={`inline-block h-[24px] max-h-[28px] w-auto shrink-0 ${className}`.trim()}
    />
  );
}
