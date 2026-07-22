import { NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { checkIns } from "@/db/schema";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const rows = await db
    .select()
    .from(checkIns)
    .where(eq(checkIns.userId, session.sub))
    .orderBy(desc(checkIns.createdAt))
    .limit(50);

  return NextResponse.json({ checkIns: rows });
}

const Body = z.object({
  status: z.enum(["safe", "caution", "help"]),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  accuracyM: z.number().nonnegative().nullable().optional(),
  placeName: z.string().trim().max(120).optional(),
  note: z.string().trim().max(500).optional(),
});

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the check-in fields and try again." }, { status: 400 });
  }

  const { status, lat, lng, accuracyM, placeName, note } = parsed.data;
  const [row] = await db
    .insert(checkIns)
    .values({
      userId: session.sub,
      status,
      lat: lat ?? null,
      lng: lng ?? null,
      accuracyM: accuracyM ?? null,
      placeName: placeName || null,
      note: note || null,
    })
    .returning();

  return NextResponse.json({ checkIn: row }, { status: 201 });
}
