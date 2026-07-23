/**
 * Generates all app icons from the brand crest.
 *
 * Source of truth is public/brand/crest.png (transparent background). No
 * vector master exists — if one lands later, point SOURCE at it and re-run.
 *
 * Outputs (all overwriting the previous placeholder icons):
 *   public/icons/icon-192.png          — PWA / favicon fallback
 *   public/icons/icon-512.png          — PWA splash source
 *   public/icons/icon-180.png          — apple-touch-icon
 *   public/icons/icon-maskable-512.png — maskable, crest inside the safe zone
 *   public/favicon.ico                 — 32px, PNG-in-ICO container
 *   public/brand/crest-ui.png          — small transparent rendition for the
 *                                        in-app Crest component (precached by
 *                                        the service worker for offline use)
 *
 * Usage: npm run icons
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE = path.join(ROOT, "public", "brand", "crest.png");
const OUT_DIR = path.join(ROOT, "public", "icons");

/** App background — matches the `paper` token and manifest background_color. */
const BACKGROUND = "#F4F6F3";

/** Crest height as a share of canvas for regular icons. */
const REGULAR_CONTENT = 0.78;
/**
 * Crest height as a share of canvas for the maskable icon: ~20% padding per
 * side keeps the full crest inside every launcher mask shape.
 */
const MASKABLE_CONTENT = 0.6;

/** Trim the transparent border once, up front. */
async function trimmedCrest() {
  return sharp(SOURCE).trim().toBuffer();
}

async function renderIcon(crest, size, contentShare, outfile) {
  const target = Math.round(size * contentShare);
  // The crest is portrait: constrain by height, keep aspect ratio.
  const scaled = await sharp(crest)
    .resize({ height: target, width: target, fit: "inside" })
    .toBuffer();
  const png = await sharp({
    create: { width: size, height: size, channels: 4, background: BACKGROUND },
  })
    .composite([{ input: scaled, gravity: "center" }])
    .png()
    .toBuffer();
  await writeFile(outfile, png);
  console.log(`wrote ${path.relative(ROOT, outfile)} (${size}px)`);
}

/**
 * Wrap a single PNG in an ICO container. Valid since Windows Vista and in
 * all modern browsers; avoids a second image dependency.
 */
function pngToIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size === 256 ? 0 : size, 0); // width
  entry.writeUInt8(size === 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8); // image data size
  entry.writeUInt32LE(22, 12); // image data offset (6 + 16)

  return Buffer.concat([header, entry, png]);
}

const crest = await trimmedCrest();

await renderIcon(crest, 192, REGULAR_CONTENT, path.join(OUT_DIR, "icon-192.png"));
await renderIcon(crest, 512, REGULAR_CONTENT, path.join(OUT_DIR, "icon-512.png"));
await renderIcon(crest, 180, REGULAR_CONTENT, path.join(OUT_DIR, "icon-180.png"));
await renderIcon(crest, 512, MASKABLE_CONTENT, path.join(OUT_DIR, "icon-maskable-512.png"));

const faviconPng = await sharp(crest)
  .resize({ height: 30, width: 30, fit: "inside" })
  .toBuffer()
  .then((scaled) =>
    sharp({ create: { width: 32, height: 32, channels: 4, background: BACKGROUND } })
      .composite([{ input: scaled, gravity: "center" }])
      .png()
      .toBuffer(),
  );
await writeFile(path.join(ROOT, "public", "favicon.ico"), pngToIco(faviconPng, 32));
console.log("wrote public/favicon.ico (32px)");

// Small transparent rendition for in-app use: 160px tall covers the largest
// placement (72px) at 2x density while staying a few KB.
const uiPng = await sharp(crest).resize({ height: 160 }).png().toBuffer();
await writeFile(path.join(ROOT, "public", "brand", "crest-ui.png"), uiPng);
console.log("wrote public/brand/crest-ui.png (160px tall)");

// Sanity check: the source must still exist and have alpha.
const meta = await sharp(await readFile(SOURCE)).metadata();
if (!meta.hasAlpha) {
  console.warn("warning: crest.png has no alpha channel — icons may have a baked background");
}
