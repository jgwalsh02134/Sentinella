"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = {
  href: string;
  label: string;
  emergency?: boolean;
  icon: (active: boolean) => JSX.Element;
};

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const tabs: Tab[] = [
  {
    href: "/",
    label: "Home",
    icon: () => (
        <svg viewBox="0 0 24 24" className="h-6 max-h-[28px] w-6 max-w-[28px]" {...stroke} aria-hidden="true">
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </svg>
    ),
  },
  {
    href: "/emergency",
    label: "Emergency",
    emergency: true,
    icon: () => (
        <svg viewBox="0 0 24 24" className="h-6 max-h-[28px] w-6 max-w-[28px]" {...stroke} aria-hidden="true">
        <path d="M12 3 3 19h18L12 3z" />
        <path d="M12 9.5v4" />
        <path d="M12 16.5h.01" />
      </svg>
    ),
  },
  {
    href: "/checkin",
    label: "Check in",
    icon: () => (
        <svg viewBox="0 0 24 24" className="h-6 max-h-[28px] w-6 max-w-[28px]" {...stroke} aria-hidden="true">
        <path d="M12 21s-6.5-5.2-6.5-10A6.5 6.5 0 0 1 12 4.5 6.5 6.5 0 0 1 18.5 11c0 4.8-6.5 10-6.5 10z" />
        <path d="m9.5 10.8 1.8 1.8 3.2-3.4" />
      </svg>
    ),
  },
  {
    href: "/guide",
    label: "Guide",
    icon: () => (
        <svg viewBox="0 0 24 24" className="h-6 max-h-[28px] w-6 max-w-[28px]" {...stroke} aria-hidden="true">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21V5.5z" />
        <path d="M20 18.5H6.5A2.5 2.5 0 0 0 4 21" />
      </svg>
    ),
  },
  {
    href: "/alerts",
    label: "Alerts",
    icon: () => (
        <svg viewBox="0 0 24 24" className="h-6 max-h-[28px] w-6 max-w-[28px]" {...stroke} aria-hidden="true">
        <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
        <path d="M10 19a2 2 0 0 0 4 0" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="bottom-nav-safe fixed inset-x-0 bottom-0 z-40 border-t border-default bg-card/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-md">
        {tabs.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const color = tab.emergency
            ? "text-signal"
            : active
              ? "text-verde"
              : "text-secondary";
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[3.5rem] flex-1 flex-col items-center justify-center gap-1 pt-2 pb-1 ${color}`}
            >
              {tab.icon(active)}
              <span className={`text-nav-label ${active ? "font-bold" : "font-medium"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
