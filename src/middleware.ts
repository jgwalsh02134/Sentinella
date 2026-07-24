import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_REFRESH_AFTER,
  sessionCookieOptions,
  signSession,
  verifySessionWithMeta,
} from "@/lib/auth";

/**
 * Auth gate. Emergency information, the guide, and alerts stay public on
 * purpose — safety-critical content should never sit behind a login. Only
 * personal features (check-ins) require a session.
 *
 * Rolling refresh: any authenticated request with a token older than a
 * day gets a re-issued cookie, so the 30-day session window slides
 * forward with use — a traveler is only signed out after a month of not
 * opening the app, never mid-trip.
 */
export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const verified = token ? await verifySessionWithMeta(token) : null;

  if (verified) {
    const res = NextResponse.next();
    const ageSeconds = verified.issuedAt
      ? Math.floor(Date.now() / 1000) - verified.issuedAt
      : Number.POSITIVE_INFINITY;
    if (ageSeconds > SESSION_REFRESH_AFTER) {
      res.cookies.set(SESSION_COOKIE, await signSession(verified.payload), sessionCookieOptions());
    }
    return res;
  }

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/checkin", "/api/checkins/:path*"],
};
