import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { runCheckinReminders } from "@/lib/reminders";

export const dynamic = "force-dynamic";

/**
 * Scheduled every 15 minutes on Railway. Reminds users whose check-in
 * interval has elapsed and escalates to admins when a reminder has gone
 * unanswered for over an hour.
 */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await runCheckinReminders();
    return NextResponse.json(result);
  } catch (err) {
    console.error("cron checkin-reminders failed:", err);
    return NextResponse.json({ error: "Reminder run failed; see server logs." }, { status: 500 });
  }
}
