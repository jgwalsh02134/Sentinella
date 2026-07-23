import { NextResponse } from "next/server";
import { getUsAdvisories, refreshUsAdvisories } from "@/lib/us-advisories";

export const dynamic = "force-dynamic";

/**
 * Public like /api/alerts: official safety information should be readable
 * without a login. The refresh is a no-op most of the time — the underlying
 * fetches revalidate at most every 6 hours — and it never throws, so an
 * unreachable .gov site still returns the last good copy, labeled stale.
 */
export async function GET() {
  try {
    await refreshUsAdvisories();
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
