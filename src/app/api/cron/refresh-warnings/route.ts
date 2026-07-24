import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { refreshWarnings } from "@/lib/official-warnings";
import { notifyNewWarnings } from "@/lib/push";

export const dynamic = "force-dynamic";

/**
 * Scheduled every 30 minutes on Railway (see README): forces a refresh of
 * MeteoAlarm and INGV — the fast-moving sources — and push-notifies the
 * rare items that clear the bar (new red warnings, new M≥4.5 quakes).
 */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await refreshWarnings(["meteoalarm", "ingv"], { force: true });
    await notifyNewWarnings(result.newItems);
    return NextResponse.json({ ...result.status, newItems: result.newItems.length });
  } catch (err) {
    console.error("cron refresh-warnings failed:", err);
    return NextResponse.json({ error: "Refresh failed; see server logs." }, { status: 500 });
  }
}
