import type { Config } from "tailwindcss";

/**
 * Sentinella design tokens.
 *
 * The palette is drawn from Italian road and civil-protection signage:
 * - verde  : autostrada-sign green, the app's working color
 * - signal : emergency red, reserved EXCLUSIVELY for emergency actions
 * - ambra  : caution, used for advisories
 * Red must never be used for decoration — if something is red, tapping it
 * calls for help. That rule is part of the interface language.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F4F6F3",
        ink: "#17201D",
        verde: {
          DEFAULT: "#0A6B44",
          deep: "#075033",
          tint: "#E4F0E9",
        },
        signal: {
          DEFAULT: "#D2232A",
          deep: "#A6151B",
          tint: "#FBE9E9",
        },
        ambra: {
          DEFAULT: "#8A5F00",
          tint: "#F6ECD1",
        },
        mist: "#5E6B67",
        line: "#DCE3DF",
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
