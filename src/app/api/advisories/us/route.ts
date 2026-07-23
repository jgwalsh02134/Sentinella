import { NextResponse } from "next/server";
import { getUsAdvisories, refreshUsAdvisories } from "@/lib/us-advisories";
import { notifyNewAdvisories } from "@/lib/push";

export const dynamic = "force-dynamic";

/**
 * Public like /api/alerts: official safety information should be readable
 * without a login. The refresh is a no-op most of the time — the underlying
 * fetches revalidate at most every 6 hours — and it never throws, so an
 * unreachable .gov site still returns the last good copy, labeled stale.
 */
export async function GET() {
  try {
    const refresh = await refreshUsAdvisories();
    if (refresh.newItems.length > 0) {
      // Fire-and-forget: notified_at stamping in notifyNewAdvisories makes
      // this safe to trigger from any refresh path without double-sending.
      void notifyNewAdvisories(refresh.newItems);
    }
    const data = await getUsAdvisories();
    return NextResponse.json(data);
  } catch (err) {
    console.error("advisories/us failed:", err);
    return NextResponse.json(
      { error: "Couldn't load official advisories. Try again shortly." },
      { status: 500 },
    );
  }
}
