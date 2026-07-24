import Button from "@/components/ui/Button";

/**
 * The Call / Directions / Website triplet used by embassies, hospitals,
 * and map places. Equal-width secondary buttons; at 320px viewports the
 * flex basis makes the row wrap 2+1 instead of squeezing labels.
 *
 * Labels say exactly what they do and stay identical everywhere:
 * "Call", "Get directions", "Website".
 */
export type Action = {
  label: string;
  href: string;
};

export default function ActionRow({
  actions,
  className = "",
}: {
  actions: Action[];
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {actions.map((action) => (
        <Button
          key={action.href + action.label}
          href={action.href}
          variant="tinted"
          size="md"
          className="min-w-0 flex-1 basis-24"
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
