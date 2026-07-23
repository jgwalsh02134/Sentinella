import Link from "next/link";
import CallPlate from "@/components/CallPlate";
import Crest from "@/components/Crest";
import LatestAlert from "@/components/LatestAlert";
import SignOutButton from "@/components/SignOutButton";
import { getSessionUser } from "@/lib/session";
import { invitesRequired } from "@/lib/invites";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSessionUser();
  const inviteOnly = invitesRequired();

  return (
    <main>
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crest size={40} priority />
          <div>
            <p className="eyebrow">Sentinella</p>
            <h1 className="title-page">
              {session ? `Ciao, ${session.name.split(" ")[0]}` : "Italy, handled."}
            </h1>
          </div>
        </div>
        {session ? (
          <SignOutButton />
        ) : (
          <Link href="/login" className="text-link text-xs">
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
        <Link href="/emergency" className="mt-2 block text-right text-sm font-semibold text-signal-deep">
          All emergency numbers & embassies →
        </Link>
      </section>

      <section className="mt-6" aria-label="Quick actions">
        <h2 className="eyebrow">Right now</h2>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Link href="/checkin" className="plate border border-line bg-white p-4">
            <span className="block text-2xl" aria-hidden="true">
              📍
            </span>
            <span className="mt-1 block text-sm font-bold">Check in</span>
            <span className="block text-xs text-mist">Log that you're safe</span>
          </Link>
          <Link href="/guide" className="plate border border-line bg-white p-4">
            <span className="block text-2xl" aria-hidden="true">
              🛡️
            </span>
            <span className="mt-1 block text-sm font-bold">Field guide</span>
            <span className="block text-xs text-mist">Scams, phrases, cities</span>
          </Link>
          <Link href="/map" className="plate col-span-2 border border-line bg-white p-4">
            <span className="block text-2xl" aria-hidden="true">
              🗺️
            </span>
            <span className="mt-1 block text-sm font-bold">Offline map</span>
            <span className="block text-xs text-mist">
              Download city maps and see where you are, no signal needed
            </span>
          </Link>
        </div>
      </section>

      <section className="mt-6" aria-label="Latest advisory">
        <h2 className="eyebrow">Latest advisory</h2>
        <div className="mt-2">
          <LatestAlert />
        </div>
      </section>

      <section className="mt-6" aria-label="Offline readiness">
        <div className="plate bg-verde-tint p-4">
          <h2 className="text-sm font-bold text-verde-deep">Built for dead zones</h2>
          <p className="mt-1 text-sm leading-relaxed text-verde-deep/80">
            Open the Emergency and Guide screens once while online and they stay available without a
            connection — numbers, phrases, and briefings included.
          </p>
        </div>
      </section>

      {!session ? (
        <section className="mt-6">
          <div className="plate border border-line bg-white p-4">
            <p className="text-sm leading-relaxed text-mist">
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
