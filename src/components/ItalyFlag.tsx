/**
 * Italian flag icon, matching the UsFlag component pattern: SVG instead of
 * emoji so it renders consistently on every platform, viewBox cropped to
 * the flag artwork, sized relative to the surrounding text.
 */
export default function ItalyFlag({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="2 9 44 30"
      className={`inline-block h-[0.875em] w-auto align-[-0.05em] ${className}`.trim()}
      aria-hidden="true"
      focusable="false"
    >
      <path fill="#ECEFF1" d="M16 9H32V39H16z" />
      <path fill="#FF3D00" d="M32 9H46V39H32z" />
      <path fill="#689F38" d="M2 9H16V39H2z" />
    </svg>
  );
}
