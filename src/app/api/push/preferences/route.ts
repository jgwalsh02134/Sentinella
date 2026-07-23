import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const Body = z.object({
  notifyOfficial: z.boolean().optional(),
  notifyTeam: z.boolean().optional(),
  notifyReminders: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  try {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success || Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    const [row] = await db
      .update(users)
      .set(parsed.data)
      .where(eq(users.id, session.sub))
      .returning({
        notifyOfficial: users.notifyOfficial,
        notifyTeam: users.notifyTeam,
        notifyReminders: users.notifyReminders,
      });

    return NextResponse.json({ preferences: row });
  } catch (err) {
    console.error("preferences update failed:", err);
    return NextResponse.json({ error: "Couldn't save preferences. Try again." }, { status: 500 });
  }
}
