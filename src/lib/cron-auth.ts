import { timingSafeEqual } from "node:crypto";

/**
 * Cron endpoints are reachable on the public web, so they demand
 * `Authorization: Bearer ${CRON_SECRET}`. With the secret unset they refuse
 * every call — failing closed beats an open cron endpoint.
 */
export function cronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}
