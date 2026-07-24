import type { ReactNode } from "react";

/**
 * Renders a prose string with every phone-looking substring as a tappable
 * tel: link — the one shared way numbers buried in text become callable
 * (HIG: never make the user retype a number). Matches:
 *
 *   +39 06 4220 0001 / +1 613 996 8885   international, spaced groups
 *   055 794111 / 0577 585111             Italian landline switchboards
 *   116 117 / 116117 / 803 116           six-digit service numbers
 *   112 / 113 / 115 / 118 / 1500 / 1522 / 1530   national short codes
 *
 * Server-safe (no hooks). Anything already inside an <a> must not pass
 * through here — nested anchors are invalid.
 */
const PHONE_RE =
  /(\+\d[\d ]{6,}\d|\b0\d{2,3} \d{5,7}\b|\b116 ?117\b|\b803 ?116\b|\b1(?:12|13|15|18|500|522|530)\b)/g;

export function telHref(display: string): string {
  return `tel:${display.replace(/[^+\d]/g, "")}`;
}

export default function TelText({ text }: { text: string }) {
  const parts = text.split(PHONE_RE);
  if (parts.length === 1) return <>{text}</>;

  const nodes: ReactNode[] = parts.map((part, i) =>
    // split() with a capturing group puts matches at odd indices.
    i % 2 === 1 ? (
      <a
        key={i}
        href={telHref(part)}
        className="font-semibold tabular-nums underline underline-offset-2"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
  return <>{nodes}</>;
}
