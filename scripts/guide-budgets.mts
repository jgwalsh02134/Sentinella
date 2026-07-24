/**
 * Guide content budget audit (Phase 4): titles ≤5 words, always-visible
 * summaries/leads/hooks/hows/counters ≤90 chars, disclosure bodies ≤60
 * words. Run: npx tsx scripts/guide-budgets.mts
 */
import { scams } from "../src/data/scams";
import { phraseGroups } from "../src/data/phrases";
import { regions } from "../src/data/regions";
import { basicsItems, healthItems } from "../src/data/health";

const words = (s: string) => s.trim().split(/\s+/).length;
let failures = 0;

function check(label: string, ok: boolean, detail: string) {
  if (!ok) {
    failures++;
    console.log(`FAIL ${label}: ${detail}`);
  }
}

for (const s of scams) {
  check(`scam "${s.title}" title`, words(s.title) <= 5, `${words(s.title)} words`);
  check(`scam "${s.title}" hook`, s.hook.length <= 90, `${s.hook.length} chars`);
  check(`scam "${s.title}" how`, s.how.length <= 90, `${s.how.length} chars`);
  check(`scam "${s.title}" counter`, s.counter.length <= 90, `${s.counter.length} chars`);
  check(`scam "${s.title}" detail`, words(s.detail) <= 60, `${words(s.detail)} words`);
}

for (const r of regions) {
  for (const list of [r.watch, r.move, ...(r.sections?.map((x) => x.bullets) ?? [])]) {
    for (const item of list) {
      check(`region "${r.name}" lead`, item.lead.length <= 90, `${item.lead.length} chars: ${item.lead}`);
      if (item.detail)
        check(`region "${r.name}" detail`, words(item.detail) <= 60, `${words(item.detail)} words`);
    }
  }
}

for (const item of [...basicsItems, ...healthItems]) {
  check(`info "${item.title}" summary`, item.summary.length <= 90, `${item.summary.length} chars`);
  if (item.detail)
    check(`info "${item.title}" detail`, words(item.detail) <= 60, `${words(item.detail)} words`);
  for (const b of item.bullets ?? [])
    check(`info "${item.title}" bullet`, words(b) <= 60, `${words(b)} words`);
}

const totals = {
  scams: scams.reduce((n, s) => n + words([s.title, s.hook, s.how, s.counter, s.detail].join(" ")), 0),
  phrases: phraseGroups.reduce(
    (n, g) => n + g.phrases.reduce((m, p) => m + words(`${p.it} ${p.en} ${p.say}`), 0),
    0,
  ),
  regions: regions.reduce((n, r) => {
    const brief = (items: { lead: string; detail?: string }[]) =>
      items.reduce((m, i) => m + words(`${i.lead} ${i.detail ?? ""}`), 0);
    return (
      n +
      words(`${r.name} ${r.headline} ${r.caveat ?? ""}`) +
      brief(r.watch) +
      brief(r.move) +
      (r.sections?.reduce((m, s) => m + words(s.label) + brief(s.bullets), 0) ?? 0)
    );
  }, 0),
  health: [...basicsItems, ...healthItems].reduce(
    (n, i) =>
      n +
      words(
        [i.title, i.summary, i.detail ?? "", i.warning ?? "", ...(i.bullets ?? []), ...(i.steps ?? [])].join(" "),
      ),
    0,
  ),
};

console.log("word totals:", totals);
console.log(failures === 0 ? "ALL BUDGETS PASS" : `${failures} budget failures`);
process.exit(failures === 0 ? 0 : 1);
