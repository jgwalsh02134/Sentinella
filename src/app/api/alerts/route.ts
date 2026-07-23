import { NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { alerts } from "@/db/schema";
import { getSessionUser } from "@/lib/session";
import { sendPush } from "@/lib/push";

export const dynamic = "force-dynamic";

/** Public on purpose: safety advisories should be readable without a login. */
export async function GET() {
  const rows = await db
    .select()
    .from(alerts)
    .where(eq(alerts.active, true))
    .orderBy(desc(alerts.createdAt))
    .limit(50);

  return NextResponse.json({ alerts: rows });
}

const Body = z.object({
  title: z.string().trim().min(1).max(140),
  body: z.string().trim().min(1).max(2000),
  severity: z.enum(["info", "advisory", "critical"]),
  region: z.string().trim().min(1).max(80).default("Nationwide"),
});

/** Publishing alerts requires the admin role (assigned via ADMIN_EMAILS). */
export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Only admins can publish alerts." }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the alert fields and try again." }, { status: 400 });
  }

  const [row] = await db.insert(alerts).values(parsed.data).returning();

  // Notify opted-in users. Best effort: a push failure must never unpublish.
  try {
    await sendPush("team", {
      title: `Team alert: ${row.title}`.slice(0, 120),
      body: `${row.region} · ${row.severity}`,
      url: "/alerts",
      tag: `team-alert-${row.id}`,
    });
  } catch (err) {
    console.error("team alert push failed:", err);
  }

  return NextResponse.json({ alert: row }, { status: 201 });
}
