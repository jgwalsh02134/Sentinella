import type { Metadata } from "next";
import { MapPin, Clock3, Users } from "lucide-react";
import CheckinPanel from "@/components/CheckinPanel";
import Icon from "@/components/Icon";
import ShareStatusLink from "@/components/ShareStatusLink";
import { getSessionUser } from "@/lib/session";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import NavTile from "@/components/ui/NavTile";
import SectionHeader from "@/components/ui/SectionHeader";

export const metadata: Metadata = { title: "Check in" };

export const dynamic = "force-dynamic";

/** Signed-out visitors get an explanation, not a bare redirect. */
function SignedOutExplainer() {
  const points = [
    {
      icon: Clock3,
      text: "One tap leaves a timestamped status — no typing needed. It saves on your phone instantly, even with no signal, and syncs later.",
    },
    {
      icon: MapPin,
      text: "Your position attaches automatically when GPS allows. Check-ins never wait for it.",
    },
    {
      icon: Users,
      text: "A private family link shows your latest status to the people you choose — approximate area only, never exact coordinates.",
    },
  ];
  return (
    <Card className="mt-5">
      <h2 className="text-headline">Sign in to check in</h2>
      <ul className="mt-3 space-y-3">
        {points.map((p) => (
          <li key={p.text} className="flex gap-3">
            <span className="mt-0.5 shrink-0 text-icon-default">
              <Icon icon={p.icon} size="md" />
            </span>
            <span className="text-callout text-secondary">{p.text}</span>
          </li>
        ))}
      </ul>
      <Button href="/login?next=/checkin" variant="filled" size="lg" className="mt-4 w-full">
        Sign in
      </Button>
    </Card>
  );
}

export default async function CheckinPage() {
  const session = await getSessionUser();

  return (
    <main>
      <SectionHeader
        level={1}
        eyebrow="Check in"
        tile={<NavTile feature="checkin" />}
        title="Leave a breadcrumb"
        intro="A timestamped status with optional position. Your history builds a trail your team or contacts can reconstruct if it's ever needed."
      />
      {session ? (
        <>
          <div className="mt-5">
            <CheckinPanel />
          </div>
          <div className="mt-8">
            <ShareStatusLink />
          </div>
        </>
      ) : (
        <SignedOutExplainer />
      )}
    </main>
  );
}
