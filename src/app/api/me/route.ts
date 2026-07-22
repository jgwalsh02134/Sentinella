import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: { id: session.sub, email: session.email, name: session.name, role: session.role },
  });
}
