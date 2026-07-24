import type { Metadata } from "next";
import CheckinPanel from "@/components/CheckinPanel";
import ShareStatusLink from "@/components/ShareStatusLink";

export const metadata: Metadata = { title: "Check in" };

export default function CheckinPage() {
  return (
    <main>
      <header>
        <p className="eyebrow">Check in</p>
        <h1 className="title-page">Leave a breadcrumb</h1>
        <p className="body-copy mt-1 text-secondary">
          A timestamped status with optional position. Your history builds a trail your team or
          contacts can reconstruct if it's ever needed.
        </p>
      </header>
      <div className="mt-4">
        <CheckinPanel />
      </div>
      <div className="mt-6">
        <ShareStatusLink />
      </div>
    </main>
  );
}
