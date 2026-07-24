import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

function shareUrl(req: Request, token: string): string {
  return new URL(`/status/${token}`, req.url).href;
}

/** Current share-link state for the signed-in user. */
export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const [row] = await db
    .select({ shareToken: users.shareToken })
    .from(users)
    .where(eq(users.id, session.sub));
  return NextResponse.json({
    url: row?.shareToken ? shareUrl(req, row.shareToken) : null,
  });
}

/** Create (or return the existing) share link. */
export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  try {
    const [existing] = await db
      .select({ shareToken: users.shareToken })
      .from(users)
      .where(eq(users.id, session.sub));
    if (existing?.shareToken) {
      return NextResponse.json({ url: shareUrl(req, existing.shareToken) });
    }

    const token = randomBytes(18).toString("base64url");
    await db.update(users).set({ shareToken: token }).where(eq(users.id, session.sub));
    return NextResponse.json({ url: shareUrl(req, token) }, { status: 201 });
  } catch (err) {
    console.error("share link create failed:", err);
    return NextResponse.json({ error: "Couldn't create the link. Try again." }, { status: 500 });
  }
}

/** Revoke the link — the old URL 404s immediately. */
export async function DELETE() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  try {
    await db.update(users).set({ shareToken: null }).where(eq(users.id, session.sub));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("share link revoke failed:", err);
    return NextResponse.json({ error: "Couldn't revoke the link. Try again." }, { status: 500 });
  }
}
