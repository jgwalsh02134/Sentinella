import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth";

const Body = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    const ok = user && (await bcrypt.compare(parsed.data.password, user.passwordHash));
    if (!ok) {
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }

    const token = await signSession({ sub: user.id, email: user.email, name: user.name, role: user.role });
    cookies().set(SESSION_COOKIE, token, sessionCookieOptions());

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("login failed:", err);
    return NextResponse.json(
      { error: "Something went wrong signing you in. Please try again." },
      { status: 500 },
    );
  }
}
