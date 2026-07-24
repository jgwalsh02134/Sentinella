/**
 * Canadian flag icon, matching the other flag components: SVG instead of
 * emoji so it renders consistently on every platform, viewBox cropped to
 * the flag artwork, sized relative to the surrounding text.
 */
export default function CanadaFlag({
  className = "",
  label,
}: {
  className?: string;
  /** Meaningful placements pass e.g. "Canada flag"; omitted = decorative,
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
      <path fill="#ECEFF1" d="M13 9H35V39H13z" />
      <path fill="#FF3D00" d="M2 9H13V39H2zM35 9H46V39H35z" />
      <path
        fill="#FF3D00"
        d="M24 15.5l1.7 3.3 2.8-1.4-.8 3.2 3.2.5-2.2 2.4 2.7 1.9-3.3 1 .5 3.2-3-1.3-.6 3.3h-2l-.6-3.3-3 1.3.5-3.2-3.3-1 2.7-1.9-2.2-2.4 3.2-.5-.8-3.2 2.8 1.4z"
      />
    </svg>
  );
}
