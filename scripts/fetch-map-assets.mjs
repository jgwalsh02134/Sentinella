/**
 * Downloads the map's self-hosted render assets from protomaps/basemaps-assets:
 *
 *   public/map-fonts/<stack>/<range>.pbf — EVERY glyph range (256 per stack)
 *     for EVERY font stack the style references. MapLibre silently drops a
 *     symbol layer's labels when a glyph range 404s, so partial hosting is
 *     a correctness bug, not an optimization.
 *   public/map-sprites/light(@2x).json/.png — the light flavor sprite sheet
 *     (highway shields, townspots). Without it, icon layers render nothing.
 *
 * Run once per font/style change: node scripts/fetch-map-assets.mjs
 * Verifies every file is non-empty; exits non-zero on any failure.
 */
import { mkdirSync, writeFileSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = "https://protomaps.github.io/basemaps-assets";

/** Every font stack referenced by the generated light-flavor style. */
const STACKS = ["Noto Sans Regular", "Noto Sans Medium", "Noto Sans Italic"];
const SPRITES = ["light.json", "light.png", "light@2x.json", "light@2x.png"];

const ranges = Array.from({ length: 256 }, (_, i) => `${i * 256}-${i * 256 + 255}`);

async function fetchTo(url, dest, { optional = false } = {}) {
  if (existsSync(dest) && statSync(dest).size > 0) return "cached";
  const res = await fetch(url);
  if (!res.ok) {
    if (optional && res.status === 404) return "missing";
    throw new Error(`${res.status} ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) throw new Error(`empty response: ${url}`);
  writeFileSync(dest, buf);
  return "fetched";
}

let fetched = 0, cached = 0;

for (const stack of STACKS) {
  const dir = join(ROOT, "public", "map-fonts", stack);
  mkdirSync(dir, { recursive: true });
  // Modest parallelism; the assets host is GitHub Pages.
  for (let i = 0; i < ranges.length; i += 16) {
    const results = await Promise.all(
      ranges.slice(i, i + 16).map(async (range) => {
        const url = `${ASSETS}/fonts/${encodeURIComponent(stack)}/${range}.pbf`;
        return fetchTo(url, join(dir, `${range}.pbf`));
      }),
    );
    for (const r of results) r === "fetched" ? fetched++ : cached++;
  }
  console.log(`${stack}: ${ranges.length} ranges present`);
}

const spriteDir = join(ROOT, "public", "map-sprites");
mkdirSync(spriteDir, { recursive: true });
for (const file of SPRITES) {
  const r = await fetchTo(`${ASSETS}/sprites/v4/${file}`, join(spriteDir, file));
  r === "fetched" ? fetched++ : cached++;
}
console.log(`sprites: ${SPRITES.join(", ")} present`);
console.log(`Done — ${fetched} fetched, ${cached} already present.`);
