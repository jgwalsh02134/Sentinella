/**
 * Check-in reliability diagnosis (Phase 1 evidence).
 *
 * Exercises the live app against production-like failure conditions and
 * prints what the user actually experiences. Run against a production
 * build with a real DATABASE_URL:
 *
 *   node scripts/diagnose-checkin.mjs http://localhost:3111 <email> <password>
 *
 * Scenarios: double-tap double-submit, offline submit, GPS permission
 * denied, GPS timeout, expired-session submit.
 */
import { chromium } from "playwright";

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

async function historyCount(page) {
  return page.evaluate(async () => {
    const r = await fetch("/api/checkins");
    if (!r.ok) return `HTTP ${r.status}`;
    const d = await r.json();
    return d.checkIns.length;
  });
}

const browser = await chromium.launch();

// ---------------------------------------------------------------- 1. double-tap
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await login(page);
  await page.goto(`${base}/checkin`, { waitUntil: "networkidle" });
  const before = await historyCount(page);
  // Two synchronous DOM clicks — faster than React can re-render `disabled`.
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Save check-in"),
    );
    btn.click();
    btn.click();
  });
  await page.waitForTimeout(2500);
  const after = await historyCount(page);
  console.log(`1. DOUBLE-TAP: history ${before} -> ${after} (created ${after - before} records)`);
  await ctx.close();
}

// ---------------------------------------------------------------- 2. offline submit
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await login(page);
  await page.goto(`${base}/checkin`, { waitUntil: "networkidle" });
  const before = await historyCount(page);
  await ctx.setOffline(true);
  await page.getByRole("button", { name: "Save check-in" }).click();
  await page.waitForTimeout(1500);
  const error = await page
    .locator('[role="alert"], .text-danger, p.text-danger')
    .allTextContents()
    .catch(() => []);
  await ctx.setOffline(false);
  await page.waitForTimeout(1000);
  const after = await historyCount(page);
  console.log(
    `2. OFFLINE SUBMIT: UI shows ${JSON.stringify(error)}; after reconnect history ${before} -> ${after} (check-in ${after > before ? "recovered" : "LOST unless manually retried"})`,
  );
  await ctx.close();
}

// ---------------------------------------------------------------- 3. GPS denied
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  // No geolocation permission granted -> Chromium denies the request.
  const page = await ctx.newPage();
  await login(page);
  await page.goto(`${base}/checkin`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /attach my position/i }).click();
  await page.waitForTimeout(2000);
  const btnText = await page
    .getByRole("button", { name: /attach my position|getting position|position attached/i })
    .textContent();
  const messages = await page.locator("p.text-danger, [role=status]").allTextContents();
  console.log(
    `3. GPS DENIED: button reads ${JSON.stringify(btnText?.trim())}; user-visible messages: ${JSON.stringify(messages)}`,
  );
  await ctx.close();
}

// ---------------------------------------------------------------- 4. GPS timeout
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    permissions: ["geolocation"],
  });
  const page = await ctx.newPage();
  // Permission granted but no fix ever arrives (deep indoors).
  await page.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = () => {
      /* never calls back; the component's own timeout must handle it */
    };
  });
  await login(page);
  await page.goto(`${base}/checkin`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /attach my position/i }).click();
  await page.waitForTimeout(2000);
  const during = await page
    .getByRole("button", { name: /attach|getting/i })
    .textContent();
  console.log(
    `4. GPS TIMEOUT: after 2s button reads ${JSON.stringify(during?.trim())} (component timeout is 15s; UI shows a spinner until then, then resets silently)`,
  );
  await ctx.close();
}

// ---------------------------------------------------------------- 5. expired session
{
  const { SignJWT } = await import("jose");
  const key = new TextEncoder().encode(AUTH_SECRET);
  const expired = await new SignJWT({
    sub: "00000000-0000-0000-0000-000000000000",
    email,
    name: "Diag",
    role: "traveler",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
    .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
    .sign(key);

  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await login(page);
  await page.goto(`${base}/checkin`, { waitUntil: "networkidle" });
  // Session expires while the app is open (traveler mid-trip).
  await ctx.addCookies([
    { name: "sentinella_session", value: expired, url: base },
  ]);
  await page.getByRole("button", { name: "Save check-in" }).click();
  await page.waitForTimeout(1500);
  const error = await page.locator("p.text-danger").allTextContents();
  console.log(`5a. EXPIRED SESSION SUBMIT: UI shows ${JSON.stringify(error)} — the check-in is not stored anywhere.`);

  // Fresh navigation with the expired cookie: hard redirect.
  await page.goto(`${base}/checkin`, { waitUntil: "networkidle" });
  console.log(`5b. EXPIRED SESSION NAVIGATION: /checkin lands on ${page.url()}`);
  await ctx.close();
}

await browser.close();
