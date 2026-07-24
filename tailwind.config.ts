import type { Config } from "tailwindcss";

/**
 * Sentinella design tokens.
 *
 * Core palette: seven Italian-drawn hues + a 10-step neutral ramp, defined
 * as RGB triplets in globals.css :root and consumed here with
 * rgb(var(--…) / <alpha-value>) so opacity modifiers work. Steps per hue:
 * 100 subtle bg · 200 tint · 600 base · 700 strong/pressed · 900 deep text.
 *
 * The rule that is LAW: solid signal-red fills are reserved EXCLUSIVELY
 * for emergency actions — if it's red, tapping it summons help. Terracotta
 * is a decorative accent and never a danger color; ambra owns warning.
 * Old names (paper/ink/mist/line, verde-deep/-tint, …) remain as aliases —
 * zero forced renames.
 */
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const scale = (hue: string) => ({
  100: v(`${hue}-100`),
  200: v(`${hue}-200`),
  600: v(`${hue}-600`),
  700: v(`${hue}-700`),
  900: v(`${hue}-900`),
});

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  // iOS sticky-hover fix: hover: styles only apply on devices that hover.
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      colors: {
        verde: {
          ...scale("verde"),
          DEFAULT: v("verde-600"),
          deep: v("verde-700"),
          tint: v("verde-200"),
        },
        signal: {
          ...scale("signal"),
          DEFAULT: v("signal-600"),
          deep: v("signal-700"),
          tint: v("signal-200"),
        },
        ambra: {
          ...scale("ambra"),
          DEFAULT: v("ambra-600"),
          tint: v("ambra-200"),
        },
        azzurro: scale("azzurro"),
        terracotta: scale("terracotta"),
        glicine: scale("glicine"),
        oliva: scale("oliva"),
        neutral: {
          0: v("neutral-0"),
          50: v("neutral-50"),
          100: v("neutral-100"),
          200: v("neutral-200"),
          300: v("neutral-300"),
          400: v("neutral-400"),
          500: v("neutral-500"),
          600: v("neutral-600"),
          700: v("neutral-700"),
          800: v("neutral-800"),
          900: v("neutral-900"),
          950: v("neutral-950"),
        },
        // Legacy aliases onto the ramp — zero forced renames.
        paper: v("neutral-50"),
        ink: v("neutral-950"),
        mist: v("neutral-600"),
        line: v("neutral-200"),
      },
      /* Semantic layer — components use these (and the raw-hue aliases
         above during migration), never raw hex. Icons take color through
         currentColor, so icon tokens surface as text-icon-*. */
      textColor: {
        primary: v("text-primary"),
        secondary: v("text-secondary"),
        tertiary: v("text-tertiary"),
        brand: v("text-brand"),
        "on-accent": v("text-on-accent"),
        danger: v("text-danger"),
        warning: v("text-warning"),
        success: v("text-success"),
        info: v("text-info"),
        accent: v("accent-700"),
        "accent-deep": v("accent-900"),
        "icon-default": v("icon-default"),
        "icon-brand": v("icon-brand"),
        "icon-on-accent": v("icon-on-accent"),
        "icon-danger": v("icon-danger"),
        "icon-warning": v("icon-warning"),
        "icon-success": v("icon-success"),
        "icon-info": v("icon-info"),
      },
      backgroundColor: {
        page: v("fill-page"),
        card: v("fill-card"),
        sunken: v("fill-sunken"),
        brand: v("fill-brand"),
        "brand-strong": v("fill-brand-strong"),
        accent: v("accent-600"),
        "accent-strong": v("accent-700"),
        "accent-subtle": v("accent-200"),
        "accent-faint": v("accent-100"),
        "danger-subtle": v("fill-danger-subtle"),
        "warning-subtle": v("fill-warning-subtle"),
        "success-subtle": v("fill-success-subtle"),
        "info-subtle": v("fill-info-subtle"),
      },
      borderColor: {
        default: v("border-default"),
        strong: v("border-strong"),
        focus: v("border-focus"),
        accent: v("accent-600"),
      },
      outlineColor: {
        focus: v("border-focus"),
      },
      ringColor: {
        focus: v("border-focus"),
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "SF Mono",
          "Menlo",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },
      borderRadius: {
        plate: "1.25rem",
      },
      boxShadow: {
        plate: "0 1px 2px rgba(23, 32, 29, 0.08), 0 4px 16px rgba(23, 32, 29, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
