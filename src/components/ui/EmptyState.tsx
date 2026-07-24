import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import Icon from "@/components/Icon";

/**
 * A designed nothing: icon + one line + optional action. Every async
 * surface that can be empty renders one of these — a bare heading with
 * nothing under it is a bug.
 *
 * tone="success" is for empties that are good news ("No active
 * advisories"): the icon ring goes verde so calm reads at a glance.
 */
export default function EmptyState({
  icon,
  title,
  body,
  action,
  tone = "neutral",
  className = "",
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
  tone?: "neutral" | "success";
  className?: string;
}) {
  const ring =
    tone === "success" ? "bg-success-subtle text-icon-success" : "bg-sunken text-icon-default";

  return (
    <div className={`plate border border-default bg-card p-6 text-center ${className}`}>
      <span
        aria-hidden="true"
        className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${ring}`}
      >
        <Icon icon={icon} size="lg" />
      </span>
      <p className="mt-3 text-headline">{title}</p>
      {body ? <p className="mt-1 text-subhead text-secondary">{body}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
