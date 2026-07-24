import { NextResponse } from "next/server";
import { getActiveWarnings, refreshWarnings } from "@/lib/official-warnings";
import { notifyNewWarnings } from "@/lib/push";

export const dynamic = "force-dynamic";

/**
 * Public, like /api/advisories/us: official warnings are safety
 * information and never sit behind auth. The inline refresh is a no-op
 * within each source's cadence (cron does the real work); it never
 * throws, so dead feeds still return last-good rows with per-source
 * check status.
 */
export async function GET() {
  try {
    const refresh = await refreshWarnings();
    if (refresh.newItems.length > 0) {
      // Fire-and-forget; notified_at claiming makes any refresh path safe.
      void notifyNewWarnings(refresh.newItems);
    }
    const data = await getActiveWarnings();
    return NextResponse.json(data);
  } catch (err) {
    console.error("api/warnings failed:", err);
    return NextResponse.json(
      { error: "Couldn't load official warnings. Try again shortly." },
      { status: 500 },
    );
  }
}
