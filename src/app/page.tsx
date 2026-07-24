import Link from "next/link";
import { ChevronRight } from "lucide-react";
import CallPlate from "@/components/ui/CallPlate";
import NavTile from "@/components/ui/NavTile";
import type { FeatureKey } from "@/components/ui/NavTile";
import SectionHeader from "@/components/ui/SectionHeader";
import Icon from "@/components/Icon";
import Crest from "@/components/Crest";
import InstallGuide from "@/components/InstallGuide";
import LatestAlert from "@/components/LatestAlert";
import LiveClock from "@/components/LiveClock";
import NotificationSettings from "@/components/NotificationSettings";
import SignOutButton from "@/components/SignOutButton";
import WarningBanner from "@/components/WarningBanner";
import WeatherCard from "@/components/WeatherCard";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { getSessionUser } from "@/lib/session";
import { invitesRequired } from "@/lib/invites";

export const dynamic = "force-dynamic";

/** iOS Settings-style navigation: inset-grouped rows, each with the
 *  feature's color tile (the navigation color map lives in NavTile and
 *  .cursorrules). Emergency leads, so it reads as a main destination. */
const navRows: Array<{ href: string; feature: FeatureKey; label: string }> = [
  { href: "/emergency", feature: "emergency", label: "Emergency numbers & embassies" },
  { href: "/checkin", feature: "checkin", label: "Check in" },
  { href: "/map", feature: "map", label: "Offline map" },
  { href: "/guide", feature: "guide", label: "Field guide" },
  { href: "/prepare", feature: "prepare", label: "Before you fly" },
  { href: "/alerts", feature: "alerts", label: "Alerts & advisories" },
];

export default async function HomePage() {
  const session = await getSessionUser();
  const inviteOnly = invitesRequired();

  return (
    <main>
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 items-center gap-3">
          <Crest size={40} priority />
          <div className="min-w-0">
            <p className="eyebrow">Sentinella</p>
            <h1 className="title-page mt-1">
              {session ? `Ciao, ${session.name.split(" ")[0]}` : "Italy, handled."}
            </h1>
          </div>
        </div>
        {session ? (
          <Button href="/checkin" variant="tinted" size="md">
            Check in
          </Button>
        ) : (
          <Link href="/login" className="text-link text-footnote">
            Sign in
          </Link>
        )}
      </header>

      {/* Live dual-timezone strip — device clock, works fully offline. */}
      <LiveClock variant="compact" className="mt-3" />

      {/* Renders only while an orange/red warning or M≥4.5 quake is
          active for Lazio/Tuscany — otherwise nothing, never a shell. */}
      <WarningBanner />

      <section className="mt-5" aria-label="Emergency">
        <CallPlate
          number="112"
          dial="112"
          name="Emergency — tap to call"
          nameIt="Numero Unico di Emergenza"
          tier="primary"
        />
      </section>

      {/* iOS inset-grouped navigation list. The whole row is the tap
          target; hairline separators inset to the text edge. Emergency
          navigation lives in the first row (red tile). */}
      <nav className="mt-6" aria-label="App sections">
        <ul className="plate overflow-hidden border border-default bg-card">
          {navRows.map((row) => (
            <li key={row.href} className="group">
              <Link
                href={row.href}
                prefetch={false}
                className="flex min-h-control-lg items-center gap-3 pl-4 active:bg-sunken"
              >
                <NavTile feature={row.feature} />
                <span className="flex min-w-0 flex-1 items-center justify-between gap-3 self-stretch border-t border-separator py-2 pr-3 group-first:border-t-0">
                  <span className="min-w-0 break-words text-body">{row.label}</span>
                  <span className="shrink-0 text-tertiary">
                    <Icon icon={ChevronRight} size="md" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Below the clock strip in reading order; the 112 plate and the
          navigation list stay above it — weather never outranks safety. */}
      <section className="mt-8" aria-label="Weather">
        <WeatherCard />
      </section>

      <section className="mt-8" aria-label="Latest advisory">
        <SectionHeader title="Latest advisory" />
        <div className="mt-3">
          <LatestAlert />
        </div>
      </section>

      {session ? (
        <section className="mt-8" aria-label="Notification settings">
          <NotificationSettings />
        </section>
      ) : null}

      {/* Grouped-list rhythm: informational card matches the white inset
          groups above it. */}
      <section className="mt-8" aria-label="Offline readiness">
        <Card>
          <h2 className="text-headline">Built for dead zones</h2>
          <p className="mt-1 text-subhead text-secondary">
            Open the Emergency and Guide screens once while online and they stay available without
            a connection — numbers, phrases, and briefings included.
          </p>
        </Card>
      </section>

      <InstallGuide />

      {!session ? (
        <section className="mt-8" aria-label="Create an account">
          <Card>
            <p className="text-body text-secondary">
              {inviteOnly ? "Have an invite code? " : "New here? "}
              <Link href="/register" className="text-link">
                Create your account
              </Link>{" "}
              to check in and see your trip history.
            </p>
          </Card>
        </section>
      ) : (
        <div className="mt-8 text-center">
          <SignOutButton />
        </div>
      )}
    </main>
  );
}
