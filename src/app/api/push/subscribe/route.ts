import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions, users } from "@/db/schema";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Current subscription state + the public key the browser needs to subscribe. */
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const [user] = await db
    .select({
      notifyOfficial: users.notifyOfficial,
      notifyTeam: users.notifyTeam,
      notifyReminders: users.notifyReminders,
      checkinReminderHours: users.checkinReminderHours,
    })
    .from(users)
    .where(eq(users.id, session.sub));

  return NextResponse.json({
    publicKey: process.env.VAPID_PUBLIC_KEY ?? null,
    preferences:
      user ?? { notifyOfficial: true, notifyTeam: true, notifyReminders: true, checkinReminderHours: 0 },
  });
}

const SubscribeBody = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: z.string().min(1).max(500), auth: z.string().min(1).max(500) }),
});

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  try {
    const parsed = SubscribeBody.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "That subscription doesn't look valid." }, { status: 400 });
    }

    await db
      .insert(pushSubscriptions)
      .values({ userId: session.sub, endpoint: parsed.data.endpoint, keys: parsed.data.keys })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { userId: session.sub, keys: parsed.data.keys },
      });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("push subscribe failed:", err);
    return NextResponse.json({ error: "Couldn't save the subscription. Try again." }, { status: 500 });
  }
}

const UnsubscribeBody = z.object({ endpoint: z.string().url().max(1000) });

export async function DELETE(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  try {
    const parsed = UnsubscribeBody.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Missing subscription endpoint." }, { status: 400 });
    }

    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.endpoint, parsed.data.endpoint),
          eq(pushSubscriptions.userId, session.sub),
        ),
      );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("push unsubscribe failed:", err);
    return NextResponse.json({ error: "Couldn't remove the subscription. Try again." }, { status: 500 });
  }
}
