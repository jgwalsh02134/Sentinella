import { NextResponse } from "next/server";
import { getActiveWarnings, refreshWarnings } from "@/lib/official-warnings";

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
    await refreshWarnings();
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
