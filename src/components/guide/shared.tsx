import BrandIcon from "@/components/BrandIcon";
import TelText from "@/components/TelText";

/**
 * Shared guide rendering helpers (server-safe, no hooks) — used by the
 * basics, health, and cities detail pages.
 */

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
