"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Five tabs reflecting what the app actually is: Home, Emergency (signal —
 * the one red tab, because tapping through it leads to help), Map, Guide,
 * Alerts. Check-in lives on the home screen (card + header shortcut).
 * Active tab = verde text + a 2px top indicator; labels wrap rather than
 * truncate at accessibility text sizes.
 */

type Tab = {
  href: string;
  label: string;
  emergency?: boolean;
  icon: JSX.Element;
};

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const iconClass = "h-6 max-h-[28px] w-6 max-w-[28px]";

const tabs: Tab[] = [
  {
    href: "/",
    label: "Home",
    icon: (
      <svg viewBox="0 0 24 24" className={iconClass} {...stroke} aria-hidden="true">
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </svg>
    ),
  },
  {
    href: "/emergency",
    label: "Emergency",
    emergency: true,
    icon: (
      <svg viewBox="0 0 24 24" className={iconClass} {...stroke} aria-hidden="true">
        <path d="M12 3 3 19h18L12 3z" />
        <path d="M12 9.5v4" />
        <path d="M12 16.5h.01" />
      </svg>
    ),
  },
  {
    href: "/map",
    label: "Map",
    icon: (
      <svg viewBox="0 0 24 24" className={iconClass} {...stroke} aria-hidden="true">
        <path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4z" />
        <path d="M9 4v14" />
        <path d="M15 6v14" />
      </svg>
    ),
  },
  {
    href: "/guide",
    label: "Guide",
    icon: (
      <svg viewBox="0 0 24 24" className={iconClass} {...stroke} aria-hidden="true">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21V5.5z" />
        <path d="M20 18.5H6.5A2.5 2.5 0 0 0 4 21" />
      </svg>
    ),
  },
  {
    href: "/alerts",
    label: "Alerts",
    icon: (
      <svg viewBox="0 0 24 24" className={iconClass} {...stroke} aria-hidden="true">
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
              // No RSC prefetch: offline, prefetches fail and spam the
              // console with errors. Navigation itself is SW-cached.
              prefetch={false}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 pb-1 pt-2 text-center ${color}`}
            >
              {active ? (
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-3 top-0 h-0.5 rounded-full ${
                    tab.emergency ? "bg-signal" : "bg-verde"
                  }`}
                />
              ) : null}
              {tab.icon}
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
