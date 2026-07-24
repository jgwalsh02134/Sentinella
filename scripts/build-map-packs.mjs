/**
 * Extracts the trip's offline map packs from a Protomaps daily build
 * (https://build.protomaps.com) into public/map-packs/, and regenerates
 * the manifest at src/data/mapPacks.ts with real byte sizes.
 *
 * Four packs ship. Minor-road NAMES only exist in Protomaps tiles from
 * z14 (verified with scripts/audit-tile-names.mjs), so the city cores are
 * cut deep enough that the street a traveler is standing on has a name:
 *   rome            — Rome metro bbox, maxzoom 14 (street/building detail)
 *   florence        — city core bbox, maxzoom 15 (small area, small file)
 *   siena           — city core bbox, maxzoom 15
 *   tuscany-region  — wide bbox (hill towns + connecting roads),
 *                     maxzoom 12, for driving context between cities
 *
 * Every extract is verified: PMTiles magic bytes, a minimum plausible size
 * (stub detection), and a HARD CAP of 45 MB per file (GitHub blocks 100 MB,
 * warns at 50 MB — 45 keeps margin). Any violation exits non-zero and
 * deletes the bad file so a stub can never be committed.
 *
 * Requires the pmtiles CLI (https://github.com/protomaps/go-pmtiles):
 *   brew install pmtiles
 *
 * Rebuild commands:
 *   node scripts/build-map-packs.mjs                    # all packs
 *   node scripts/build-map-packs.mjs florence           # one pack
 *   PROTOMAPS_BUILD=20260723 node scripts/build-map-packs.mjs
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, openSync, readSync, closeSync, rmSync, statSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUILD = process.env.PROTOMAPS_BUILD ?? "20260723";
const SOURCE = `https://build.protomaps.com/${BUILD}.pmtiles`;
const OUT_DIR = join(ROOT, "public", "map-packs");
const MANIFEST = join(ROOT, "src", "data", "mapPacks.ts");

const HARD_CAP_MB = 45;
const MIN_PLAUSIBLE_MB = 1; // anything smaller is a failed/stub extract

/** The data model stays city-agnostic: add/remove entries here only.
 *  `kind` drives auto-selection: a "core" pack always beats a "region"
 *  pack when both cover the viewport (deeper zoom wins). */
const PACKS = [
  {
    id: "rome",
    name: "Rome",
    nameIt: "Roma",
    kind: "core",
    bbox: [12.17, 41.65, 12.73, 42.05],
    center: [12.4964, 41.9028],
    maxzoom: 14,
  },
  {
    id: "florence",
    name: "Florence",
    nameIt: "Firenze",
    kind: "core",
    // City core: historic center + Oltrarno + Campo di Marte/Novoli belt.
    bbox: [11.15, 43.72, 11.36, 43.84],
    center: [11.2558, 43.7696],
    maxzoom: 15,
  },
  {
    id: "siena",
    name: "Siena",
    nameIt: "Siena",
    kind: "core",
    // City core inside and just beyond the walls.
    bbox: [11.28, 43.28, 11.4, 43.36],
    center: [11.3308, 43.3188],
    maxzoom: 15,
  },
  {
    id: "tuscany-region",
    name: "Tuscany region",
    nameIt: "Toscana",
    kind: "region",
    // Florence, Siena, Pisa, Lucca, San Gimignano, Volterra, Cortona,
    // Montepulciano + the connecting roads (A1/A11/SR2/SR68/raccordi).
    // z12 = driving context; street-level detail comes from core packs.
    bbox: [10.25, 42.95, 12.1, 43.95],
    center: [11.2558, 43.7696],
    maxzoom: 12,
  },
];

const check = spawnSync("pmtiles", ["--help"], { stdio: "ignore" });
if (check.error) {
  console.error("The pmtiles CLI is not installed. Install it with: brew install pmtiles");
  process.exit(1);
}

function fail(msg) {
  console.error(`\nFATAL: ${msg}`);
  process.exit(1);
}

/** Verify magic bytes + plausible size + hard cap; deletes bad files. */
function verifyPack(path, label) {
  const size = statSync(path).size;
  const mb = size / 1024 / 1024;

  const fd = openSync(path, "r");
  const head = Buffer.alloc(7);
  readSync(fd, head, 0, 7, 0);
  closeSync(fd);

  if (head.toString("latin1") !== "PMTiles") {
    rmSync(path);
    fail(`${label}: not a PMTiles archive (bad magic bytes). File deleted.`);
  }
  if (mb < MIN_PLAUSIBLE_MB) {
    rmSync(path);
    fail(`${label}: only ${mb.toFixed(2)} MB — almost certainly a stub/failed extract. File deleted.`);
  }
  if (mb > HARD_CAP_MB) {
    rmSync(path);
    fail(`${label}: ${mb.toFixed(1)} MB exceeds the ${HARD_CAP_MB} MB hard cap. File deleted — lower maxzoom and re-run.`);
  }
  return size;
}

const only = process.argv.slice(2).map((s) => s.toLowerCase());
const selected = only.length ? PACKS.filter((c) => only.includes(c.id)) : PACKS;
if (!selected.length) {
  fail(`No matching packs. Known ids: ${PACKS.map((c) => c.id).join(", ")}`);
}

mkdirSync(OUT_DIR, { recursive: true });

for (const pack of selected) {
  const out = join(OUT_DIR, `${pack.id}.pmtiles`);
  console.log(`\n== ${pack.name}: extracting z0-${pack.maxzoom} of ${pack.bbox.join(",")} from ${BUILD} ==`);
  const res = spawnSync(
    "pmtiles",
    ["extract", SOURCE, out, `--bbox=${pack.bbox.join(",")}`, `--maxzoom=${pack.maxzoom}`, "--download-threads=4"],
    { stdio: "inherit" },
  );
  if (res.status !== 0) fail(`Extract failed for ${pack.name}.`);
  const size = verifyPack(out, pack.name);
  console.log(`   -> ${out} (${(size / 1024 / 1024).toFixed(1)} MB, verified)`);
}

// Remove any pack file that is no longer in the PACKS list.
for (const file of readdirSync(OUT_DIR)) {
  const id = file.replace(/\.pmtiles$/, "");
  if (file.endsWith(".pmtiles") && !PACKS.some((p) => p.id === id)) {
    rmSync(join(OUT_DIR, file));
    console.log(`Removed stale pack: ${file}`);
  }
}

// Manifest with real, verified sizes for every pack on disk.
const entries = PACKS.flatMap((pack) => {
  let size;
  try {
    size = verifyPack(join(OUT_DIR, `${pack.id}.pmtiles`), pack.name);
  } catch {
    return []; // pack not generated/shipped — leave it out of the app
  }
  return [{ ...pack, sizeBytes: size }];
});
if (!entries.length) fail("No verified packs on disk — nothing to write to the manifest.");

const manifest = `/**
 * Generated by scripts/build-map-packs.mjs — do not edit by hand.
 * Protomaps build ${BUILD}. Regenerate after changing bounding boxes or
 * shipping new packs. Every pack is verified (magic bytes, size caps).
 */
export type MapPack = {
  id: string;
  name: string;
  nameIt: string;
  /** "core" = deep city detail (wins auto-selection); "region" = wide driving context. */
  kind: "core" | "region";
  /** [minLon, minLat, maxLon, maxLat] */
  bbox: [number, number, number, number];
  /** [lng, lat] */
  center: [number, number];
  /** Max tile zoom baked into the archive. */
  maxzoom: number;
  sizeBytes: number;
};

export const MAP_PACKS: MapPack[] = ${JSON.stringify(
  entries.map(({ id, name, nameIt, kind, bbox, center, maxzoom, sizeBytes }) => ({ id, name, nameIt, kind, bbox, center, maxzoom, sizeBytes })),
  null,
  2,
)};
`;
writeFileSync(MANIFEST, manifest);
console.log(`\nWrote ${MANIFEST} with ${entries.length} packs.`);
