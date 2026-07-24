import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth";
import { inviteCodes } from "@/lib/invites";

const Body = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  inviteCode: z.string().trim().max(100).optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Check the form and try again.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { name, password } = parsed.data;
    const email = parsed.data.email.toLowerCase();

    if (!process.env.AUTH_SECRET) {
      return NextResponse.json(
        { error: "Registration is not configured. Set AUTH_SECRET on the server." },
        { status: 500 },
      );
    }

    // With INVITE_CODES unset or empty, registration is open and any submitted
    // code is ignored. With codes configured, one of them is required.
    const validCodes = inviteCodes();
    if (validCodes.length > 0) {
      const submitted = (parsed.data.inviteCode ?? "").toUpperCase();
      if (!submitted) {
        return NextResponse.json({ error: "An invite code is required." }, { status: 403 });
      }
      if (!validCodes.includes(submitted)) {
        return NextResponse.json({ error: "That invite code is not valid." }, { status: 403 });
      }
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
  } catch (err) {
    console.error("register failed:", err);
    return NextResponse.json(
      { error: "Account creation failed. Try again." },
      { status: 500 },
    );
  }
}
