import type { Metadata } from "next";
import CheckinPanel from "@/components/CheckinPanel";

export const metadata: Metadata = { title: "Check in" };

export default function CheckinPage() {
  return (
    <main>
      <header>
        <p className="eyebrow">Check in</p>
        <h1 className="text-2xl font-extrabold tracking-tight">Leave a breadcrumb</h1>
        <p className="mt-1 text-sm leading-relaxed text-mist">
          A timestamped status with optional position. Your history builds a trail your team or
          contacts can reconstruct if it's ever needed.
        </p>
      </header>
      <div className="mt-4">
        <CheckinPanel />
      </div>
    </main>
  );
}
