import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The one button, aligned to the iOS button system. Every tappable action
 * is one of these styles — ad-hoc button class soup outside
 * src/components/ui/ is a bug.
 *
 *   filled     tint (verde) fill, white semibold text. EXACTLY ONE VISIBLE
 *              PER SCREEN — it marks the screen's single most important
 *              action. Pressed = one shade darker.
 *   tinted     tint at 15% opacity, tint text. The workhorse secondary.
 *              Pressed deepens the wash.
 *   gray       secondary fill (sunken), tint text. Secondary actions that
 *              shouldn't read as brand-colored washes.
 *   plain      tint text only — inline links and tertiary actions.
 *   emergency  solid signal fill — EXEMPT from the iOS anatomy and
 *              unchanged. LINT RULE: usable ONLY inside genuine emergency
 *              components (CallPlate contexts, the check-in "help" path).
 *              Verified by grep: `variant="emergency"` appears only in
 *              emergency UI.
 *
 * destructive: applies systemRed TEXT to tinted/gray/plain (never a red
 * fill — red fills stay emergency-only, our law and iOS's own destructive
 * style). A destructive `filled` is impossible: the prop is ignored on
 * filled and the variant renders as tinted destructive instead.
 *
 * Sizes (iOS): lg 50pt full-width CTAs · md 44pt · sm 34pt inline, with
 * continuous-feel radii 14/12/10. Pressed = 0.15s ease; hover states only
 * compile on devices that hover (future.hoverOnlyWhenSupported); focus is
 * the global ring; disabled = neutral tokens, never opacity.
 */

type Variant = "filled" | "tinted" | "gray" | "plain" | "emergency";
type Size = "lg" | "md" | "sm";

const VARIANT_CLASSES: Record<Variant, string> = {
  filled: "bg-brand text-on-accent hover:bg-brand-strong active:bg-brand-strong",
  tinted: "bg-verde-600/15 text-brand hover:bg-verde-600/25 active:bg-verde-600/25",
  gray: "bg-sunken text-brand hover:bg-neutral-200 active:bg-neutral-200",
  plain: "text-brand hover:text-verde-900 active:text-verde-900",
  emergency: "bg-signal text-white hover:bg-signal-deep active:bg-signal-deep",
};

/* systemRed TEXT on the same anatomies; washes go red-tinted. */
const DESTRUCTIVE_CLASSES: Record<Exclude<Variant, "filled" | "emergency">, string> = {
  tinted: "bg-signal-600/15 text-danger hover:bg-signal-600/25 active:bg-signal-600/25",
  gray: "bg-sunken text-danger hover:bg-neutral-200 active:bg-neutral-200",
  plain: "text-danger hover:text-signal-900 active:text-signal-900",
};

const SIZE_CLASSES: Record<Size, string> = {
  lg: "min-h-btn-lg rounded-btn-lg px-5 text-body",
  md: "min-h-btn rounded-btn px-4 text-callout",
  sm: "min-h-btn-sm rounded-btn-sm px-3 text-subhead",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 text-center font-semibold " +
  "transition-colors duration-150 ease-out " +
  "disabled:bg-sunken disabled:text-tertiary";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  /** systemRed text on tinted/gray/plain. Never produces a red fill. */
  destructive?: boolean;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = CommonProps & {
  href?: undefined;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  "aria-label"?: string;
};

type ButtonAsLink = CommonProps & {
  /** tel:, external https, or internal path — the element adapts. */
  href: string;
  target?: string;
  rel?: string;
  "aria-label"?: string;
};

type ButtonProps = ButtonAsButton | ButtonAsLink;

function variantClasses(variant: Variant, destructive: boolean): string {
  if (!destructive || variant === "emergency") return VARIANT_CLASSES[variant];
  // Red fills are emergency-only: a destructive "filled" downgrades to
  // the tinted destructive anatomy.
  if (variant === "filled") return DESTRUCTIVE_CLASSES.tinted;
  return DESTRUCTIVE_CLASSES[variant];
}

export default function Button(props: ButtonProps) {
  const { variant = "tinted", size = "md", destructive = false, className = "" } = props;
  const classes = `${BASE_CLASSES} ${variantClasses(variant, destructive)} ${SIZE_CLASSES[size]} ${className}`;

  if (props.href !== undefined) {
    const external = /^https?:/.test(props.href);
    if (props.href.startsWith("/")) {
      return (
        <Link
          href={props.href}
          prefetch={false}
          aria-label={props["aria-label"]}
          className={classes}
        >
          {props.children}
        </Link>
      );
    }
    return (
      <a
        href={props.href}
        target={props.target ?? (external ? "_blank" : undefined)}
        rel={props.rel ?? (external ? "noopener noreferrer" : undefined)}
        aria-label={props["aria-label"]}
        className={classes}
      >
        {props.children}
      </a>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      disabled={props.disabled}
      aria-label={props["aria-label"]}
      className={classes}
    >
      {props.children}
    </button>
  );
}
