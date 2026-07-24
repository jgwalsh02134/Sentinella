/**
 * Check-in reliability verification (Phase 2 matrix).
 *
 *   node scripts/verify-checkin-reliability.mjs http://localhost:3111 <email> <password>
 *
 * Matrix: offline submit -> pending -> reconnect -> syncs exactly once;
 * double-tap -> one record; GPS denied -> saves without coordinates with
 * the honest message; expired session -> quiet banner -> login -> auto-
 * sync; rolling 30-day session re-issues the cookie.
 */
import { chromium } from "playwright";
import { SignJWT, decodeJwt } from "jose";

const [base = "http://localhost:3111", email = "diag@test.dev", password = "password-123"] =
  process.argv.slice(2);
const AUTH_SECRET = process.env.AUTH_SECRET ?? "critique-secret-0123456789";

async function login(page) {
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 10000 });
}

async function serverCount(page) {
  return page.evaluate(async () => {
    const r = await fetch("/api/checkins");
    if (!r.ok) return `HTTP ${r.status}`;
    return (await r.json()).checkIns.length;
  });
}

const browser = await chromium.launch();

// ------------------------------------------------ 1. offline -> pending -> sync once
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await login(page);
  await page.goto(`${base}/checkin`, { waitUntil: "networkidle" });
  const before = await serverCount(page);
  await ctx.setOffline(true);
  await page.getByRole("button", { name: "I'm safe" }).click();
  await page.waitForTimeout(1000);
  const confirmation = await page.locator("[role=status]").allTextContents();
  const pendingShown = await page.getByText("Waiting to sync").count();
  await ctx.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await page.waitForTimeout(12000); // background GPS cap is 10s; sync follows
  const after = await serverCount(page);
  const stillPending = await page.getByText("Waiting to sync").count();
  console.log(
    `1. OFFLINE SUBMIT: confirmation=${JSON.stringify(confirmation)} pendingRow=${pendingShown >= 1}; after reconnect server ${before} -> ${after} (expected +1), pending rows left: ${stillPending}`,
  );
  await ctx.close();
}

// ------------------------------------------------ 2. double-tap -> one record
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await login(page);
  await page.goto(`${base}/checkin`, { waitUntil: "networkidle" });
  const before = await serverCount(page);
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("I'm safe"),
    );
    btn.click();
    btn.click();
  });
  await page.waitForTimeout(12000);
  const after = await serverCount(page);
  console.log(`2. DOUBLE-TAP: server ${before} -> ${after} (created ${after - before}, expected 1)`);
  await ctx.close();
}

// ------------------------------------------------ 3. GPS denied -> saves without coords
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage(); // no geolocation permission = denied
  await login(page);
  await page.goto(`${base}/checkin`, { waitUntil: "networkidle" });
  const before = await serverCount(page);
  await page.getByRole("button", { name: "I'm safe" }).click();
  await page.waitForTimeout(4000);
  const notes = await page.locator("[role=status]").allTextContents();
  const after = await serverCount(page);
  const lastRow = await page.evaluate(async () => {
    const r = await fetch("/api/checkins");
    const d = await r.json();
    const row = d.checkIns[0];
    return { lat: row.lat, lng: row.lng };
  });
  console.log(
    `3. GPS DENIED: server ${before} -> ${after}; coords=${JSON.stringify(lastRow)}; messages=${JSON.stringify(notes)}`,
  );
  await ctx.close();
}

// ------------------------------------------------ 4. expired session -> banner -> login -> auto-sync
{
  const key = new TextEncoder().encode(AUTH_SECRET);
  const expired = await new SignJWT({ sub: "0", email, name: "X", role: "traveler" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
    .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
    .sign(key);

  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await login(page);
  await page.goto(`${base}/checkin`, { waitUntil: "networkidle" });
  const before = await serverCount(page);
  // Session dies while the screen is open.
  await ctx.addCookies([{ name: "sentinella_session", value: expired, url: base }]);
  await page.getByRole("button", { name: "I'm safe" }).click();
  await page.waitForTimeout(12000);
  const banner = await page.getByText(/sign in to sync/i).allTextContents();
  // Sign back in — LoginForm flushes the queue after auth.
  await login(page);
  await page.goto(`${base}/checkin`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  const after = await serverCount(page);
  const bannerGone = (await page.getByText(/sign in to sync/i).count()) === 0;
  console.log(
    `4. EXPIRED SESSION: banner=${JSON.stringify(banner)}; after re-login server ${before} -> ${after} (expected +1), banner cleared: ${bannerGone}`,
  );
  await ctx.close();
}

// ------------------------------------------------ 5. rolling 30-day session
{
  const key = new TextEncoder().encode(AUTH_SECRET);
  const iat = Math.floor(Date.now() / 1000) - 60 * 60 * 48; // 2 days old
  const user = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }).then((r) => r.json());
  const aged = await new SignJWT({
    sub: user.user.id,
    email,
    name: user.user.name,
    role: "traveler",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(iat)
    .setExpirationTime(iat + 60 * 60 * 24 * 30)
    .sign(key);
  const res = await fetch(`${base}/api/checkins`, {
    headers: { cookie: `sentinella_session=${aged}` },
  });
  const setCookie = res.headers.get("set-cookie") ?? "";
  const fresh = /sentinella_session=([^;]+)/.exec(setCookie)?.[1];
  let verdict = "NOT re-issued";
  if (fresh) {
    const claims = decodeJwt(fresh);
    const days = Math.round((claims.exp - Date.now() / 1000) / 86400);
    verdict = `re-issued, new expiry ~${days} days out, Max-Age=${/Max-Age=(\d+)/.exec(setCookie)?.[1]}`;
  }
  console.log(`5. ROLLING SESSION: GET with 2-day-old token (30d life): cookie ${verdict}`);
}

await browser.close();
