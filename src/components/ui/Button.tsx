import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The one button. Every tappable action in the app is one of these five
 * variants — ad-hoc button class soup outside src/components/ui/ is a bug.
 *
 *   primary     verde fill, white text. MAX ONE VISIBLE PER SCREEN — it
 *               marks the screen's single most important action.
 *   secondary   verde-tint fill, verde-deep text. The workhorse.
 *   quiet       text-only verde. Tertiary actions, inline affordances.
 *   destructive signal TEXT + border, never a fill — red fills summon help.
 *   emergency   solid signal fill. LINT RULE: importable/usable ONLY inside
 *               genuine emergency components (CallPlate contexts, the
 *               check-in "help" path). Verified by grep:
 *               `variant="emergency"` must appear only in emergency UI.
 *
 * Pressed = one step darker; hover states only compile on devices that
 * hover (future.hoverOnlyWhenSupported); focus is the global ring;
 * disabled = neutral tokens, never opacity.
 */

type Variant = "primary" | "secondary" | "quiet" | "destructive" | "emergency";
type Size = "lg" | "md";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-brand text-on-accent hover:bg-brand-strong active:bg-brand-strong",
  secondary: "bg-verde-tint text-verde-deep hover:bg-verde-600/25 active:bg-verde-600/25",
  quiet: "text-verde-deep hover:bg-verde-tint active:bg-verde-tint",
  destructive:
    "border border-signal-600 text-danger hover:bg-danger-subtle active:bg-danger-subtle",
  emergency: "bg-signal text-white hover:bg-signal-deep active:bg-signal-deep",
};

const SIZE_CLASSES: Record<Size, string> = {
  md: "min-h-control px-4 text-callout",
  lg: "min-h-control-lg px-5 text-body",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-2xl text-center font-bold " +
  "transition-colors duration-150 ease-out " +
  "disabled:border-transparent disabled:bg-sunken disabled:text-tertiary";

type CommonProps = {
  variant?: Variant;
  size?: Size;
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

export default function Button(props: ButtonProps) {
  const { variant = "secondary", size = "md", className = "" } = props;
  const classes = `${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`;

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
