/**
 * Evidence tool for the street-label audit: decodes one MVT tile out of a
 * local PMTiles archive and reports, per requested layer, feature counts by
 * `kind` and how many of each carry a `name` property. This proves whether
 * street names exist IN THE DATA at a given zoom — independent of any style.
 *
 * Usage:
 *   node scripts/audit-tile-names.mjs <pack.pmtiles> <lon> <lat> <z> [layer]
 * Example (Florence center at the Tuscany pack's maxzoom):
 *   node scripts/audit-tile-names.mjs public/map-packs/tuscany.pmtiles 11.2558 43.7696 13 roads
 *
 * Requires the pmtiles CLI (brew install pmtiles) for tile extraction.
 */
import { spawnSync } from "node:child_process";
import { gunzipSync } from "node:zlib";

const [pack, lonArg, latArg, zArg, layerArg] = process.argv.slice(2);
if (!pack || !lonArg || !latArg || !zArg) {
  console.error("usage: node scripts/audit-tile-names.mjs <pack.pmtiles> <lon> <lat> <z> [layer]");
  process.exit(1);
}
const lon = Number(lonArg), lat = Number(latArg), z = Number(zArg);
const wantLayer = layerArg ?? "roads";

const n = 2 ** z;
const x = Math.floor(((lon + 180) / 360) * n);
const rad = (lat * Math.PI) / 180;
const y = Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n);

const res = spawnSync("pmtiles", ["tile", pack, String(z), String(x), String(y)], {
  maxBuffer: 64 * 1024 * 1024,
});
if (res.status !== 0) {
  console.error(res.stderr?.toString() || "pmtiles tile failed");
  process.exit(1);
}
let data = res.stdout;
if (data.length === 0) {
  console.log(`z${z} ${x}/${y}: EMPTY TILE (no data at this zoom/location)`);
  process.exit(0);
}
if (data[0] === 0x1f && data[1] === 0x8b) data = gunzipSync(data);

function readVarint(buf, pos) {
  let result = 0n, shift = 0n, p = pos;
  for (;;) {
    const b = buf[p++];
    result |= BigInt(b & 0x7f) << shift;
    if ((b & 0x80) === 0) break;
    shift += 7n;
  }
  return [result, p];
}
function* fields(buf) {
  let p = 0;
  while (p < buf.length) {
    let key; [key, p] = readVarint(buf, p);
    const field = Number(key >> 3n), wire = Number(key & 7n);
    if (wire === 0) { let v; [v, p] = readVarint(buf, p); yield [field, v]; }
    else if (wire === 2) { let len; [len, p] = readVarint(buf, p); const s = buf.subarray(p, p + Number(len)); p += Number(len); yield [field, s]; }
    else if (wire === 5) { yield [field, buf.subarray(p, p + 4)]; p += 4; }
    else if (wire === 1) { yield [field, buf.subarray(p, p + 8)]; p += 8; }
  }
}
function parseValue(buf) {
  for (const [f, v] of fields(buf)) {
    if (f === 1) return v.toString("utf8");
    if (f === 4 || f === 5 || f === 6) return Number(v);
    if (f === 7) return Boolean(v);
  }
  return null;
}

console.log(`${pack} tile z${z} ${x}/${y}`);
for (const [field, val] of fields(data)) {
  if (field !== 3) continue; // layer message
  let name = "?", keys = [], values = [], featureTags = [];
  for (const [f, v] of fields(val)) {
    if (f === 1) name = v.toString("utf8");
    else if (f === 3) keys.push(v.toString("utf8"));
    else if (f === 4) values.push(parseValue(v));
    else if (f === 2) for (const [ff, fv] of fields(v)) if (ff === 2) featureTags.push(fv);
  }
  if (name !== wantLayer && wantLayer !== "*") continue;
  const kindIdx = keys.indexOf("kind"), nameIdx = keys.indexOf("name");
  const total = {}, named = {}, samples = {};
  for (const tags of featureTags) {
    let p = 0; const arr = [];
    while (p < tags.length) { let v; [v, p] = readVarint(tags, p); arr.push(Number(v)); }
    let kind = "?", featureName = null;
    for (let i = 0; i < arr.length; i += 2) {
      if (arr[i] === kindIdx) kind = String(values[arr[i + 1]]);
      if (arr[i] === nameIdx && typeof values[arr[i + 1]] === "string") featureName = values[arr[i + 1]];
    }
    total[kind] = (total[kind] ?? 0) + 1;
    if (featureName) {
      named[kind] = (named[kind] ?? 0) + 1;
      (samples[kind] ??= new Set());
      if (samples[kind].size < 3) samples[kind].add(featureName);
    }
  }
  console.log(`layer=${name}`);
  for (const k of Object.keys(total).sort()) {
    const s = samples[k] ? ` e.g. ${[...samples[k]].join(" | ")}` : "";
    console.log(`  ${k}: total=${total[k]} named=${named[k] ?? 0}${s}`);
  }
}
