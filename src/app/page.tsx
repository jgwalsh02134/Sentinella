import Link from "next/link";
import { Map, MapPin, Plane, Shield } from "lucide-react";
import CallPlate from "@/components/ui/CallPlate";
import Icon from "@/components/Icon";
import Crest from "@/components/Crest";
import InstallGuide from "@/components/InstallGuide";
import LatestAlert from "@/components/LatestAlert";
import NotificationSettings from "@/components/NotificationSettings";
import SignOutButton from "@/components/SignOutButton";
import { getSessionUser } from "@/lib/session";
import { invitesRequired } from "@/lib/invites";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSessionUser();
  const inviteOnly = invitesRequired();

  return (
    <main>
      <header className="flex flex-wrap items-center justify-between gap-y-2">
        <div className="flex min-w-0 items-center gap-3">
          <Crest size={40} priority />
          <div className="min-w-0">
            <p className="eyebrow">Sentinella</p>
            <h1 className="title-page">
              {session ? `Ciao, ${session.name.split(" ")[0]}` : "Italy, handled."}
            </h1>
          </div>
        </div>
        {session ? (
          <SignOutButton />
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
        <Link href="/emergency" className="mt-2 block text-right text-callout font-semibold text-danger">
          All emergency numbers & embassies →
        </Link>
      </section>

      {/* No visible header: four parallel cards explain themselves. */}
      <section className="mt-6" aria-label="Quick actions">
        <div className="grid grid-cols-2 gap-3">
          <Link href="/checkin" className="plate border border-default bg-card p-4">
            <span className="block text-verde">
              <Icon icon={MapPin} size="lg" />
            </span>
            <span className="mt-1 block text-headline">Check in</span>
            <span className="block text-footnote text-secondary">Log that you're safe</span>
          </Link>
          <Link href="/guide" className="plate border border-default bg-card p-4">
            <span className="block text-verde">
              <Icon icon={Shield} size="lg" />
            </span>
            <span className="mt-1 block text-headline">Field guide</span>
            <span className="block text-footnote text-secondary">Scams, phrases, cities</span>
          </Link>
          <Link href="/map" className="plate col-span-2 border border-default bg-card p-4">
            <span className="block text-verde">
              <Icon icon={Map} size="lg" />
            </span>
            <span className="mt-1 block text-headline">Offline map</span>
            <span className="block text-footnote text-secondary">Works with zero signal</span>
          </Link>
          <Link href="/prepare" className="plate col-span-2 border border-default bg-card p-4">
            <span className="block text-verde">
              <Icon icon={Plane} size="lg" />
            </span>
            <span className="mt-1 block text-headline">Before you fly</span>
            <span className="block text-footnote text-secondary">Pre-departure checklist</span>
          </Link>
        </div>
      </section>

      <section className="mt-8" aria-label="Latest advisory">
        <h2 className="title-section">Latest advisory</h2>
        <div className="mt-2">
          <LatestAlert />
        </div>
      </section>

      {session ? (
        <section className="mt-6" aria-label="Notification settings">
          <NotificationSettings />
        </section>
      ) : null}

      <section className="mt-6" aria-label="Offline readiness">
        <div className="plate bg-verde-tint p-4">
          <h2 className="text-headline text-verde-deep">Built for dead zones</h2>
          <p className="mt-1 text-subhead text-verde-deep/80">
            Open the Emergency and Guide screens once while online and they stay available without a
            connection — numbers, phrases, and briefings included.
          </p>
        </div>
      </section>

      <InstallGuide />

      {!session ? (
        <section className="mt-6">
          <div className="plate border border-default bg-card p-4">
            <p className="text-body text-secondary">
              {inviteOnly ? "Have an invite code? " : "New here? "}
              <Link href="/register" className="text-link">
                Create your account
              </Link>{" "}
              to check in and see your trip history.
            </p>
          </div>
        </section>
      ) : null}
    </main>
  );
}
