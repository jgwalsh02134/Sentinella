import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import Icon from "@/components/Icon";
import { getActiveWarnings, isBannerWorthy } from "@/lib/official-warnings";

/**
 * Home banner for genuinely significant active warnings in Lazio/Tuscany:
 * orange or red severity, or an M≥4.5 earthquake. No active warning
 * renders NOTHING — never a placeholder.
 *
 * Color law: ambra tint while the worst item is orange; signal TINT when
 * red — tinted, never a solid red fill (solid signal is reserved for
 * emergency actions; this is a notice, not a call button).
 */
export default async function WarningBanner() {
  let worthy;
  try {
    const { warnings } = await getActiveWarnings();
    // "For Lazio/Tuscany": items region-tagged to either region.
    worthy = warnings.filter((w) => isBannerWorthy(w) && w.regions.length > 0);
  } catch (err) {
    console.error("[warning-banner] read failed:", err);
    return null;
  }
  if (worthy.length === 0) return null;

  const red = worthy.some((w) => w.severity === "red");
  const top = worthy[0];
  const more = worthy.length - 1;

  return (
    <Link
      href="/alerts"
      className={`mt-3 flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2.5 ${
        red ? "bg-danger-subtle text-danger" : "bg-warning-subtle text-warning"
      }`}
    >
      <Icon icon={TriangleAlert} size="md" className="shrink-0" />
      <span className="min-w-0 flex-1 text-callout font-semibold">
        {top.title}
        {more > 0 ? ` — and ${more} more` : ""}
      </span>
      <span className="shrink-0 text-footnote font-semibold underline underline-offset-2">
        Alerts
      </span>
    </Link>
  );
}
