/**
 * State Department advisory level names. Client-safe constants — the
 * server-only fetching/parsing lives in src/lib/us-advisories.ts.
 */
export const ADVISORY_LEVEL_NAMES: Record<number, string> = {
  1: "Exercise Normal Precautions",
  2: "Exercise Increased Caution",
  3: "Reconsider Travel",
  4: "Do Not Travel",
};
