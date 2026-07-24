import BrandIcon from "@/components/BrandIcon";
import SealBadge from "@/components/SealBadge";
import Button from "@/components/ui/Button";
import ListRow from "@/components/ui/ListRow";
import { stateDeptWhatsApp } from "@/data/stateDeptWhatsApp";

/**
 * The State Department's WhatsApp channel, on three surfaces from one
 * config (src/data/stateDeptWhatsApp.ts):
 *
 *   full     the follow flow — summary, numbered steps, Open channel +
 *            App Store buttons, one-way-broadcast footnote. Lives inside
 *            the /prepare "Set up before leaving US soil" task item.
 *   compact  a single ListRow that opens the channel — /emergency
 *            (U.S. citizens) and /alerts (under the State Dept panel).
 *
 * Brand marks per BrandIcon rules: WhatsApp mark on the channel link
 * (a WhatsApp destination), Apple mark on the App Store link.
 */
export default function StateDeptWhatsAppCard({
  variant,
  title = stateDeptWhatsApp.compactTitle,
}: {
  variant: "full" | "compact";
  /** Compact only: contextual row title (e.g. "Get these on WhatsApp"). */
  title?: string;
}) {
  if (variant === "compact") {
    return (
      <ListRow
        href={stateDeptWhatsApp.channelUrl}
        icon={<BrandIcon brand="whatsapp" size={20} />}
        title={title}
        subtitle="Official State Dept channel — needs a connection"
      />
    );
  }

  return (
    <div>
      <p className="body-copy flex items-start gap-2 text-secondary">
        <SealBadge className="mt-0.5" />
        <span>{stateDeptWhatsApp.summary}</span>
      </p>
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        {stateDeptWhatsApp.steps.map((step) => (
          <li key={step} className="body-copy text-secondary">
            {step}
          </li>
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          href={stateDeptWhatsApp.channelUrl}
          variant="tinted"
          size="md"
          className="min-w-0 flex-1 basis-24"
        >
          <BrandIcon brand="whatsapp" size={16} className="shrink-0" />
          {stateDeptWhatsApp.openLabel}
        </Button>
        <Button
          href={stateDeptWhatsApp.appStoreUrl}
          variant="gray"
          size="md"
          className="min-w-0 flex-1 basis-24"
        >
          <BrandIcon brand="apple" size={16} className="shrink-0" />
          {stateDeptWhatsApp.appStoreLabel}
        </Button>
      </div>
      <p className="mt-2 text-footnote text-secondary">{stateDeptWhatsApp.footnote}</p>
    </div>
  );
}
