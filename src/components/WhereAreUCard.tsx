import ActionRow from "@/components/ui/ActionRow";
import Card from "@/components/ui/Card";
import BrandIcon from "@/components/BrandIcon";
import { whereAreUApp } from "@/data/emergency";

/** Brand mark only when the brand is the destination (BrandIcon rules). */
function storeIcon(url: string) {
  if (url.includes("apps.apple.com")) return <BrandIcon brand="apple" size={16} />;
  if (url.includes("play.google.com")) return <BrandIcon brand="google" size={16} />;
  return undefined;
}

/**
 * The 112 Where ARE U app card — the ONE source of truth, rendered
 * identically by the Emergency screen and the guide's Basics tab. Same
 * copy, both store links, same "active in Lazio and Tuscany" caveat.
 */
export default function WhereAreUCard({
  headingLevel = 2,
}: {
  /** h2 on Emergency, h3 inside the guide's tab sections. */
  headingLevel?: 2 | 3;
}) {
  const Heading = `h${headingLevel}` as "h2" | "h3";

  return (
    <Card as="article">
      <Heading className="text-headline">{whereAreUApp.title}</Heading>
      <p className="body-copy mt-2 text-secondary">{whereAreUApp.body}</p>
      <ul className="mt-2 space-y-2">
        {whereAreUApp.bullets.map((bullet) => (
          <li key={bullet} className="body-copy text-secondary">
            {bullet}
          </li>
        ))}
      </ul>
      {/* Paired store buttons: App Store + Google Play side by side,
          TINTED, brand glyph + label. */}
      <ActionRow
        className="mt-3"
        actions={whereAreUApp.links.map((link) => ({
          label: link.label,
          href: link.url,
          icon: storeIcon(link.url),
        }))}
      />
      <p className="mt-2 text-footnote text-secondary">{whereAreUApp.note}</p>
    </Card>
  );
}
