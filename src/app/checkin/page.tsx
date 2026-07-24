import type { Metadata } from "next";
import CheckinPanel from "@/components/CheckinPanel";
import ShareStatusLink from "@/components/ShareStatusLink";
import NavTile from "@/components/ui/NavTile";
import SectionHeader from "@/components/ui/SectionHeader";

export const metadata: Metadata = { title: "Check in" };

export default function CheckinPage() {
  return (
    <main>
      <SectionHeader
        level={1}
        eyebrow="Check in"
        tile={<NavTile feature="checkin" />}
        title="Leave a breadcrumb"
        intro="A timestamped status with optional position. Your history builds a trail your team or contacts can reconstruct if it's ever needed."
      />
      <div className="mt-5">
        <CheckinPanel />
      </div>
      <div className="mt-8">
        <ShareStatusLink />
      </div>
    </main>
  );
}
