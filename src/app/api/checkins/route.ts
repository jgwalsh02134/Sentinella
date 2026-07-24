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
  // Nullish: the offline queue serializes empty fields as null.
  placeName: z.string().trim().max(120).nullish(),
  note: z.string().trim().max(500).nullish(),
  isAuto: z.boolean().optional(),
  /** Client-generated idempotency key: retries never duplicate. */
  clientId: z.string().uuid().optional(),
  /** When the check-in actually happened (offline queue submits later). */
  createdAt: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the check-in fields and try again." }, { status: 400 });
  }

  const { status, lat, lng, accuracyM, placeName, note, isAuto, clientId, createdAt } = parsed.data;

  // Idempotent insert: a retried clientId returns the existing row
  // instead of creating a second one.
  const [row] = await db
    .insert(checkIns)
    .values({
      userId: session.sub,
      clientId: clientId ?? null,
      status,
      lat: lat ?? null,
      lng: lng ?? null,
      accuracyM: accuracyM ?? null,
      placeName: placeName || null,
      note: note || null,
      isAuto: isAuto ?? false,
      // Trust the client's timestamp only within reason: an offline
      // check-in keeps its real moment; garbage falls back to now().
      ...(createdAt && Math.abs(Date.now() - Date.parse(createdAt)) < 1000 * 60 * 60 * 24 * 30
        ? { createdAt: new Date(createdAt) }
        : {}),
    })
    .onConflictDoNothing({ target: checkIns.clientId })
    .returning();

  if (!row && clientId) {
    const existing = await db.query.checkIns.findFirst({
      where: eq(checkIns.clientId, clientId),
    });
    // Only report someone else's row as "yours" never: enforce ownership.
    if (existing && existing.userId === session.sub) {
      return NextResponse.json({ checkIn: existing, advisories: [], duplicate: true });
    }
    return NextResponse.json({ error: "Check the check-in fields and try again." }, { status: 400 });
  }

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
