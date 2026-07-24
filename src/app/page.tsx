import Link from "next/link";
import { Map, MapPin, Plane, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import CallPlate from "@/components/ui/CallPlate";
import SectionHeader from "@/components/ui/SectionHeader";
import Icon from "@/components/Icon";
import Crest from "@/components/Crest";
import InstallGuide from "@/components/InstallGuide";
import LatestAlert from "@/components/LatestAlert";
import NotificationSettings from "@/components/NotificationSettings";
import SignOutButton from "@/components/SignOutButton";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { getSessionUser } from "@/lib/session";
import { invitesRequired } from "@/lib/invites";

export const dynamic = "force-dynamic";

/** 2×2 quick actions — identical shape, parallel copy: icon, 2–3 word
 *  title, ≤6-word descriptor. */
const quickActions: Array<{
  href: string;
  icon: LucideIcon;
  title: string;
  descriptor: string;
}> = [
  { href: "/checkin", icon: MapPin, title: "Check in", descriptor: "Log that you're safe" },
  { href: "/guide", icon: Shield, title: "Field guide", descriptor: "Scams, phrases, cities" },
  { href: "/map", icon: Map, title: "Offline map", descriptor: "Works with zero signal" },
  { href: "/prepare", icon: Plane, title: "Before you fly", descriptor: "Pre-departure checklist" },
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
          <Button href="/checkin" variant="secondary" size="md">
            Check in
          </Button>
        ) : (
          <Link href="/login" className="text-link text-footnote">
            Sign in
          </Link>
        )}
      </header>

      <section className="mt-5" aria-label="Emergency">
        <CallPlate
          number="112"
          dial="112"
          name="Emergency — tap to call"
          nameIt="Numero Unico di Emergenza"
          tier="primary"
        />
        <p className="mt-2 text-right">
          <Link href="/emergency" className="text-link text-callout">
            All emergency numbers & embassies
          </Link>
        </p>
      </section>

      {/* No visible header: four parallel cards explain themselves. */}
      <section className="mt-8" aria-label="Quick actions">
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              prefetch={false}
              className="plate border border-default bg-card p-4"
            >
              <span className="block text-icon-brand">
                <Icon icon={action.icon} size="lg" />
              </span>
              <span className="mt-2 block text-headline">{action.title}</span>
              <span className="mt-1 block text-footnote text-secondary">{action.descriptor}</span>
            </Link>
          ))}
        </div>
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

      <section className="mt-8" aria-label="Offline readiness">
        <div className="plate bg-verde-tint p-4">
          <h2 className="text-headline text-verde-deep">Built for dead zones</h2>
          <p className="mt-1 text-subhead text-verde-deep/80">
            Open the Emergency and Guide screens once while online and they stay available without
            a connection — numbers, phrases, and briefings included.
          </p>
        </div>
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
