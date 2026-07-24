import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { refreshWarnings } from "@/lib/official-warnings";

export const dynamic = "force-dynamic";

/**
 * Scheduled hourly on Railway (see README): GDACS moves slower than the
 * weather/seismic feeds, so it gets its own cadence.
 */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await refreshWarnings(["gdacs"], { force: true });
    return NextResponse.json({ gdacs: result.status.gdacs, newItems: result.newItems.length });
  } catch (err) {
    console.error("cron refresh-gdacs failed:", err);
    return NextResponse.json({ error: "Refresh failed; see server logs." }, { status: 500 });
  }
}
