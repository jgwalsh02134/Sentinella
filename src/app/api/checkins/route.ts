import { NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { checkIns } from "@/db/schema";
import { getSessionUser } from "@/lib/session";
import { advisoriesNear, type NearbyAdvisory } from "@/lib/advisory-proximity";

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
  isAuto: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the check-in fields and try again." }, { status: 400 });
  }

  const { status, lat, lng, accuracyM, placeName, note, isAuto } = parsed.data;
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
      isAuto: isAuto ?? false,
    })
    .returning();

  // Advisory proximity: surface anything active near these coordinates so
  // the caution appears immediately after checking in. Never blocks the
  // check-in itself.
  let advisories: NearbyAdvisory[] = [];
  if (lat != null && lng != null) {
    try {
      advisories = await advisoriesNear(lat, lng);
    } catch (err) {
      console.error("advisory proximity failed:", err);
    }
  }

  return NextResponse.json({ checkIn: row, advisories }, { status: 201 });
}
