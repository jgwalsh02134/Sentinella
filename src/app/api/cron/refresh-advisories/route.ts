import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { refreshUsAdvisories } from "@/lib/us-advisories";
import { notifyNewAdvisories } from "@/lib/push";

export const dynamic = "force-dynamic";

/**
 * Scheduled every 6 hours on Railway. Forces a refresh of both .gov feeds
 * (bypassing the fetch cache) and notifies opted-in users about items that
 * have never been notified — the notified_at stamp makes re-runs safe.
 */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await refreshUsAdvisories({ force: true });
    await notifyNewAdvisories(result.newItems);
    return NextResponse.json({
      state: result.state,
      embassy: result.embassy,
      newItems: result.newItems.length,
    });
  } catch (err) {
    console.error("cron refresh-advisories failed:", err);
    return NextResponse.json({ error: "Refresh failed; see server logs." }, { status: 500 });
  }
}
