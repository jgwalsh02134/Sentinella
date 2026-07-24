/**
 * Irish flag icon, matching the other flag components: SVG instead of emoji
 * so it renders consistently on every platform, viewBox cropped to the flag
 * artwork, sized relative to the surrounding text.
 */
export default function IrelandFlag({
  className = "",
  label,
}: {
  className?: string;
  /** Meaningful placements pass e.g. "Ireland flag"; omitted = decorative,
      hidden from assistive tech. */
  label?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="2 9 44 30"
      className={`inline-block h-[0.875em] w-auto align-[-0.05em] ${className}`.trim()}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path fill="#ECEFF1" d="M16 9H32V39H16z" />
      <path fill="#FF9800" d="M32 9H46V39H32z" />
      <path fill="#689F38" d="M2 9H16V39H2z" />
    </svg>
  );
}
