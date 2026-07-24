import test from "node:test";
import assert from "node:assert/strict";
import { formatDualTime, isDstMismatch, italyAheadHours } from "./timezones";

test("Oct 20 2026: both zones on summer time — 6 hours apart", () => {
  assert.equal(italyAheadHours(new Date("2026-10-20T12:00:00Z")), 6);
});

test("Oct 28 2026: Italy fell back (Oct 25), US hasn't (Nov 1) — 5 hours apart", () => {
  assert.equal(italyAheadHours(new Date("2026-10-28T12:00:00Z")), 5);
});

test("Nov 3 2026: both zones on standard time — 6 hours apart", () => {
  assert.equal(italyAheadHours(new Date("2026-11-03T12:00:00Z")), 6);
});

test("mismatch note visibility agrees with the computed offsets", () => {
  assert.equal(isDstMismatch(new Date("2026-10-20T12:00:00Z")), false);
  assert.equal(isDstMismatch(new Date("2026-10-28T12:00:00Z")), true);
  assert.equal(isDstMismatch(new Date("2026-11-03T12:00:00Z")), false);
});

test("self-activates next year too (2027 gap is Oct 31 – Nov 7)", () => {
  // Europe falls back Oct 31 2027; the US on Nov 7 2027.
  assert.equal(isDstMismatch(new Date("2027-11-03T12:00:00Z")), true);
  assert.equal(isDstMismatch(new Date("2027-10-27T12:00:00Z")), false);
});

test("dual format renders both zones from one instant", () => {
  const s = formatDualTime(new Date("2026-07-23T12:05:00Z"));
  assert.match(s, /14:05 in Italy · 8:05 AM in New York/);
});
