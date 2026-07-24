import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "sentinella_session";
/**
 * 30 days, with rolling refresh: the middleware re-issues the cookie on
 * any authenticated request once the token is over a day old, so a
 * session only expires after 30 days of NOT USING THE APP — a traveler
 * who signed in before the trip stays signed in through it.
 */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
/** Re-issue the cookie when the token is older than this. */
export const SESSION_REFRESH_AFTER = 60 * 60 * 24; // 1 day

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: "traveler" | "admin";
};

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set. Add it to your environment (see .env.example).");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  return (await verifySessionWithMeta(token))?.payload ?? null;
}

/** Verification plus issued-at, so the middleware can decide to refresh. */
export async function verifySessionWithMeta(
  token: string,
): Promise<{ payload: SessionPayload; issuedAt: number | null } | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (
      typeof payload.sub === "string" &&
      typeof payload.email === "string" &&
      typeof payload.name === "string" &&
      (payload.role === "traveler" || payload.role === "admin")
    ) {
      return {
        payload: {
          sub: payload.sub,
          email: payload.email,
          name: payload.name,
          role: payload.role,
        },
        issuedAt: typeof payload.iat === "number" ? payload.iat : null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_MAX_AGE,
    path: "/",
  };
}
