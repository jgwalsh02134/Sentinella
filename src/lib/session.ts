import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "./auth";

/** Reads and verifies the session cookie in a Server Component or Route Handler. */
export async function getSessionUser(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}
