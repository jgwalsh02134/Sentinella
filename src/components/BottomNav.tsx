"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Five tabs reflecting what the app actually is: Home, Emergency, Map,
 * Guide, Alerts. Check-in lives on the home screen (card + header
 * shortcut). Active-tab tint follows the navigation color map (see
 * NavTile + .cursorrules): Home verde, Emergency signal red (the
 * emergency affordance), Map blue, Guide orange, Alerts teal — blue/
 * orange/teal use Apple's accessible-contrast variants (the base values
 * sit under 4.5:1 as 12px label text on white). Only the
 * ACTIVE tab is tinted (icon + label + 2px indicator); inactive tabs
 * stay gray — color marks where you are, never decorates. Labels wrap
 * rather than truncate at accessibility text sizes.
 */

type Tab = {
  href: string;
  label: string;
  /** Active-state tint: text color + indicator fill. */
  activeText: string;
  activeIndicator: string;
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
    activeText: "text-verde",
    activeIndicator: "bg-verde",
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
    activeText: "text-signal",
    activeIndicator: "bg-signal",
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
    activeText: "text-ios-blue-deep",
    activeIndicator: "bg-ios-blue-deep",
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
    activeText: "text-ios-orange-deep",
    activeIndicator: "bg-ios-orange-deep",
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
    activeText: "text-ios-teal-deep",
    activeIndicator: "bg-ios-teal-deep",
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
          const color = active ? tab.activeText : "text-secondary";
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
                  className={`absolute inset-x-3 top-0 h-0.5 rounded-full ${tab.activeIndicator}`}
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
