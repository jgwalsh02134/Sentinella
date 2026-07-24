import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { checkIns, users } from "@/db/schema";
import DstNote from "@/components/DstNote";
import TelText from "@/components/TelText";
import Card from "@/components/ui/Card";
import SectionHeader from "@/components/ui/SectionHeader";
import { nearestRegion } from "@/lib/region-geo";
import { relativeTime } from "@/lib/relative-time";
import { formatDualDateTime } from "@/lib/timezones";

/**
 * Public read-only status page behind an unguessable token. Deliberately
 * coarse: first name, latest status, place NAME only — never coordinates,
 * because family forwards links. Revoking the link (share_token = null)
 * makes this 404 immediately.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Traveler status",
  robots: { index: false, follow: false },
};

const STATUS_META = {
  safe: { label: "Safe", chip: "bg-verde text-white" },
  caution: { label: "Caution", chip: "bg-ambra text-white" },
  // Solid signal is allowed here: "help" is a genuine emergency state.
  help: { label: "Needs help", chip: "bg-signal text-white" },
} as const;

export default async function StatusPage({ params }: { params: { token: string } }) {
  const [user] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.shareToken, params.token));
  if (!user) notFound();

  const [latest] = await db
    .select()
    .from(checkIns)
    .where(eq(checkIns.userId, user.id))
    .orderBy(desc(checkIns.createdAt))
    .limit(1);

  const firstName = user.name.split(" ")[0];
  const meta = latest ? STATUS_META[latest.status] : null;
  // Coarse location only: the traveler's own words, else the nearest region.
  const coarsePlace =
    latest?.placeName ??
    (latest?.lat != null && latest?.lng != null
      ? (() => {
          const region = nearestRegion(latest.lat, latest.lng);
          return region ? `near ${region}` : null;
        })()
      : null);

  return (
    <main>
      <SectionHeader level={1} eyebrow="Traveler status" title={firstName} />

      {latest && meta ? (
        <Card className="mt-5">
          <span
            className={`inline-block rounded-full px-4 py-2 text-callout font-bold uppercase tracking-wide ${meta.chip}`}
          >
            {meta.label}
          </span>
          <p className="body-copy mt-3 text-primary">
            {firstName} checked in {relativeTime(latest.createdAt)}
            {coarsePlace ? (
              <>
                {" "}
                — <span className="font-bold">{coarsePlace}</span>
              </>
            ) : null}
            .
          </p>
          <p className="mt-2 text-subhead tabular-nums text-secondary">
            {formatDualDateTime(latest.createdAt)}
          </p>
          <div className="mt-3">
            <DstNote />
          </div>
        </Card>
      ) : (
        <Card className="mt-5">
          <p className="body-copy text-secondary">
            {firstName} hasn't checked in yet. This page updates the moment they do.
          </p>
        </Card>
      )}

      <p className="mt-4 text-footnote text-secondary">
        <TelText text="Shared from Sentinella, a travel safety app. This page shows an approximate area at most — never exact coordinates — and is informational, not monitored in real time. In an emergency in Italy, call 112." />
      </p>
    </main>
  );
}
