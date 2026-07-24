/* Phase 1 diagnostic: open /map headlessly, capture console + failed requests. */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3111";
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

const consoleMsgs = [];
const failedReqs = [];
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") {
    consoleMsgs.push(`[${m.type()}] ${m.text().slice(0, 300)}`);
  }
});
page.on("pageerror", (e) => consoleMsgs.push(`[pageerror] ${String(e).slice(0, 300)}`));
page.on("requestfailed", (r) =>
  failedReqs.push(`${r.method()} ${r.url()} — ${r.failure()?.errorText}`),
);
page.on("response", (r) => {
  if (r.status() >= 400) failedReqs.push(`${r.status()} ${r.url()}`);
});

await page.goto(`${BASE}/map`, { waitUntil: "networkidle" });
await page.waitForTimeout(8000);

const mapState = await page.evaluate(() => {
  const m = window.__sentinellaMap;
  if (!m) return { present: false };
  return {
    present: true,
    loaded: m.loaded(),
    styleLoaded: m.isStyleLoaded(),
    canvasCount: document.querySelectorAll(".maplibregl-canvas").length,
  };
});

console.log("=== map state ===");
console.log(JSON.stringify(mapState, null, 2));
console.log("=== console errors/warnings ===");
console.log(consoleMsgs.length ? consoleMsgs.join("\n") : "(none)");
console.log("=== failed requests ===");
console.log(failedReqs.length ? failedReqs.join("\n") : "(none)");

await page.screenshot({ path: "/tmp/map-audit.png" });
await browser.close();
