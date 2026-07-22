import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth";

const Body = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  inviteCode: z.string().trim().min(1, "Invite code is required"),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Check the form and try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { name, password, inviteCode } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const validCodes = (process.env.INVITE_CODES ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  if (validCodes.length === 0) {
    return NextResponse.json(
      { error: "Registration is not configured. Set INVITE_CODES on the server." },
      { status: 500 },
    );
  }
  if (!validCodes.includes(inviteCode)) {
    return NextResponse.json({ error: "That invite code is not valid." }, { status: 403 });
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const role = adminEmails.includes(email) ? ("admin" as const) : ("traveler" as const);

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(users)
    .values({ email, name, passwordHash, role })
    .returning({ id: users.id, email: users.email, name: users.name, role: users.role });

  const token = await signSession({ sub: user.id, email: user.email, name: user.name, role: user.role });
  cookies().set(SESSION_COOKIE, token, sessionCookieOptions());

  return NextResponse.json({ user });
}
