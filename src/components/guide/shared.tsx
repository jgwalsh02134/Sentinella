import BrandIcon from "@/components/BrandIcon";
import TelText from "@/components/TelText";

/**
 * Shared guide rendering helpers (server-safe, no hooks) — used by the
 * basics, health, and cities detail pages.
 */

/**
 * Split off the first sentence so an item's lead can render bold and the
 * key fact scans in two seconds. Avoids false breaks after abbreviations
 * ("U.S. STEP") by requiring a lowercase letter, digit, or closing
 * punctuation before the period. Returns null for single-sentence bodies —
 * if everything is bold, nothing is.
 */
function splitFirstSentence(text: string): [string, string] | null {
  for (let i = 1; i < text.length - 2; i++) {
    if (text[i] === "." && text[i + 1] === " " && /[a-z0-9)'"’”]/.test(text[i - 1])) {
      return [text.slice(0, i + 1), text.slice(i + 2)];
    }
  }
  return null;
}

/** Body copy with a bold first-sentence lead. Phone numbers become tel: links. */
export function LeadBody({ text }: { text: string }) {
  const split = splitFirstSentence(text);
  if (!split) return <TelText text={text} />;
  return (
    <>
      <strong className="font-bold text-primary">
        <TelText text={split[0]} />
      </strong>{" "}
      <TelText text={split[1]} />
    </>
  );
}

/** Bullets: bold the place/topic before a leading colon. */
export function ColonLead({ text }: { text: string }) {
  const idx = text.indexOf(":");
  if (idx === -1 || idx > 40) return <TelText text={text} />;
  return (
    <>
      <strong className="font-bold text-primary">
        <TelText text={text.slice(0, idx + 1)} />
      </strong>
      <TelText text={text.slice(idx + 1)} />
    </>
  );
}

/** Official external resources render as PLAIN links, not fake buttons.
 *  Brand mark only when the brand is the destination (Apple Maps). */
export function ResourceLinks({ links }: { links: { label: string; url: string }[] }) {
  return (
    <p className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
      {links.map((link) => {
        const external = !link.url.startsWith("/");
        const appleMaps = link.url.startsWith("https://maps.apple.com");
        return (
          <a
            key={link.url}
            href={link.url}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            className="text-link inline-flex items-center gap-1 py-1 text-callout"
          >
            {appleMaps ? <BrandIcon brand="apple" size={16} /> : null}
            {link.label}
          </a>
        );
      })}
    </p>
  );
}
