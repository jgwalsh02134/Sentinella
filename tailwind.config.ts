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
 *
 * Spacing rhythm (4/8 ladder, Tailwind's default scale IS the token set —
 * 1=4 2=8 3=12 4=16 5=20 6=24 8=32 10=40 12=48):
 *   page gutter 16 (px-4) · card padding 16 (p-4) · gap between cards 12
 *   (gap-3/space-y-3) · gap between sections 32 (mt-8) · eyebrow→heading 4
 *   (mt-1) · heading→body 8 (mt-2). No arbitrary spacing values in
 *   components.
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
    /* Type ladder mirroring Apple's text styles (size/line-height at the
       default setting), defined in rem so the whole scale tracks iOS
       Dynamic Type: globals.css sets `font: -apple-system-body` on <html>,
       making 1rem = the user's chosen body size (17px at default).

       This REPLACES Tailwind's default sizes on purpose — text-sm/text-lg
       etc. no longer exist, so every size in the app is one of these and
       nothing can quietly fall below caption (12px).

         title-lg 28/34 bold   — the page h1 (Apple: Title 1)
         title    22/28 bold   — major sections (Apple: Title 2)
         headline 17/22 semi   — card titles (Apple: Headline)
         body     17/24        — default reading text (Apple: Body)
         callout  16/21        — buttons, highlighted notes (Apple: Callout)
         subhead  15/20        — secondary text (Apple: Subheadline)
         footnote 13/18        — metadata, attributions (Apple: Footnote)
         caption  12/16        — badges, micro-labels (Apple: Caption 1)

       numeral/numeral-lg are the plate signage sizes — display numerals,
       not text; they scale with the same root. */
    fontSize: {
      caption: ["0.7059rem", { lineHeight: "0.9412rem" }],
      footnote: ["0.7647rem", { lineHeight: "1.0588rem" }],
      subhead: ["0.8824rem", { lineHeight: "1.1765rem" }],
      callout: ["0.9412rem", { lineHeight: "1.2353rem" }],
      body: ["1rem", { lineHeight: "1.4118rem" }],
      headline: ["1rem", { lineHeight: "1.2941rem", fontWeight: "600" }],
      title: ["1.2941rem", { lineHeight: "1.6471rem", fontWeight: "700" }],
      "title-lg": ["1.6471rem", { lineHeight: "2rem", fontWeight: "700" }],
      /* Signage numerals and tab-bar labels scale with Dynamic Type but are
         capped (as iOS caps tab bars and large titles at accessibility
         sizes) so the layout survives the largest settings. */
      numeral: ["min(2.125rem, 15vw)", { lineHeight: "1" }],
      "numeral-lg": ["min(3.5rem, 26vw)", { lineHeight: "1" }],
      "nav-label": ["min(0.7059rem, 15px)", { lineHeight: "1.35" }],
    },
    /* Shape: exactly two surface radii — 2xl (16px) for cards, plates, and
       buttons; xl (12px) for inputs and chips. This REPLACES Tailwind's
       default radius scale so nothing off-scale can be written. `xs` is not
       a surface radius: it exists only for micro glyphs (the checklist
       checkbox) and the focus-ring underlay. */
    borderRadius: {
      none: "0",
      xs: "0.25rem",
      xl: "0.75rem",
      "2xl": "1rem",
      full: "9999px",
    },
    /* Elevation: ONE treatment. Cards separate from the page with a 1px
       border-default. Shadow exists solely for the 112 emergency plate so
       it is physically the deepest thing on any screen. This REPLACES the
       default shadow scale — shadow-sm/md/lg cannot be written. */
    boxShadow: {
      none: "none",
      plate:
        "0 2px 4px rgba(23, 32, 29, 0.14), 0 10px 28px rgba(23, 32, 29, 0.14)",
    },
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
      /* Control heights, rem-based so they grow with Dynamic Type:
         md ≈ 47px (comfortably past the 44px HIG floor), lg ≈ 55px for the
         screen's main action. minHeight/minWidth read the spacing scale. */
      spacing: {
        control: "2.75rem",
        "control-lg": "3.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
