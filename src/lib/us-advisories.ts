/**
 * Server-side ingestion of official U.S. government advisories. Never import
 * from client components: these fetches rely on server-to-server access
 * (CORS would block browsers) and on the Next data cache for revalidation.
 *
 * Sources (verified live 2026-07-23):
 *  - State Department travel advisories RSS: TAsTWs.xml. The Italy item IS
 *    the Italy Travel Advisory — level, date, and full body. We read it from
 *    the feed rather than scraping the travel.state.gov HTML page because
 *    the page sits behind Akamai bot management and 403s non-browser
 *    clients; the feed is the machine-readable publication of the same
 *    content and links to the official page.
 *  - U.S. Embassy & Consulates in Italy "Alerts" WordPress category feed:
 *    the location-specific items (demonstrations, strikes, incidents).
 *
 * Refresh strategy: fetch through the Next data cache with 6-hour
 * revalidation; parse defensively; upsert last-good rows into the
 * external_advisories table keyed by URL. On any failure we log and keep the
 * previous copy — the API then serves stale-but-labeled data.
 */
import { request as httpsRequest } from "node:https";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { externalAdvisories, type ExternalAdvisory } from "@/db/schema";
import { regions } from "@/data/regions";

export const STATE_FEED_URL = "https://travel.state.gov/_res/rss/TAsTWs.xml";
export const EMBASSY_FEED_URL = "https://it.usembassy.gov/category/alert/feed/";
const REVALIDATE_SECONDS = 6 * 60 * 60;

/** travel.state.gov 403s unidentified clients; a browser UA is required. */
const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  Accept: "application/rss+xml, application/xml, text/xml, */*",
};

/* ------------------------------ region tagging ------------------------------ */

/**
 * Extra search terms per region from src/data/regions.ts. Names not listed
 * here fall back to matching the region name itself.
 */
const REGION_ALIASES: Record<string, string[]> = {
  Rome: ["rome", "roma", "fiumicino", "ciampino", "lazio"],
  Milan: ["milan", "milano", "malpensa", "linate", "lombardy", "lombardia"],
  Naples: ["naples", "napoli", "campania", "vesuvius", "pompeii", "sorrento", "capri", "salerno"],
  Florence: ["florence", "firenze", "tuscany", "toscana", "pisa"],
  Venice: ["venice", "venezia", "veneto", "mestre"],
  "South & islands (driving)": [
    "amalfi",
    "sicily",
    "sicilia",
    "palermo",
    "catania",
    "sardinia",
    "sardegna",
    "cagliari",
    "puglia",
    "bari",
    "calabria",
  ],
};

/** Region names from src/data/regions.ts detected in the given text. */
export function tagRegions(text: string): string[] {
  const hay = ` ${text.toLowerCase()} `;
  return regions
    .map((r) => r.name)
    .filter((name) => {
      const terms = REGION_ALIASES[name] ?? [name.toLowerCase()];
      return terms.some((t) => hay.includes(t));
    });
}

/* ------------------------------ XML utilities ------------------------------ */
/*
 * Deliberately dependency-free: both feeds are plain RSS 2.0, and adding an
 * XML parser package is not on the table. Every helper tolerates missing
 * tags and returns empty strings rather than throwing.
 */

function unwrapCdata(s: string): string {
  const m = s.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  return m ? m[1] : s;
}

function decodeEntities(s: string): string {
  return s
    .replace(/ /g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function itemBlocks(xml: string): string[] {
  return xml.match(/<item[\s>][\s\S]*?<\/item>/g) ?? [];
}

function tagText(block: string, tag: string): string {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  return m ? unwrapCdata(m[1]).trim() : "";
}

function allTagTexts(block: string, tag: string): string[] {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "gi");
  return Array.from(block.matchAll(re), (m) => unwrapCdata(m[1]).trim());
}

/** HTML → readable plain text with paragraph breaks. */
function stripHtml(html: string): string {
  const text = decodeEntities(
    html
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<\/(p|div|section|li|h[1-6]|tr)>/gi, "\n")
      .replace(/<(br|hr)\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  );
  return text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .slice(0, 8000);
}

function parseDate(s: string): Date | null {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/* -------------------------------- parsers -------------------------------- */

type ParsedItem = {
  source: "state_advisory" | "state_rss" | "embassy";
  title: string;
  body: string;
  url: string;
  level: number | null;
  regions: string[];
  publishedAt: Date | null;
};

/**
 * The advisories feed covers every country; keep Italy items only. The item
 * whose link is the Italy destination page is the Italy Travel Advisory
 * itself; anything else Italy-tagged (e.g. a Worldwide Caution) is state_rss.
 */
export function parseStateFeed(xml: string): ParsedItem[] {
  const out: ParsedItem[] = [];
  for (const block of itemBlocks(xml)) {
    const title = decodeEntities(tagText(block, "title"));
    const url = tagText(block, "link");
    if (!title || !url) continue;
    const categories = allTagTexts(block, "category").map(decodeEntities);
    const isItaly = categories.includes("IT") || /\bitaly\b/i.test(title);
    if (!isItaly) continue;

    const levelMatch = (title + " " + categories.join(" ")).match(/Level\s*(\d)/i);
    const body = stripHtml(tagText(block, "description"));
    out.push({
      source: /destination\.ita\b/i.test(url) ? "state_advisory" : "state_rss",
      title,
      body,
      url,
      level: levelMatch ? Number(levelMatch[1]) : null,
      regions: tagRegions(`${title}\n${body}`),
      publishedAt: parseDate(tagText(block, "pubDate")),
    });
  }
  return out;
}

export function parseEmbassyFeed(xml: string): ParsedItem[] {
  const out: ParsedItem[] = [];
  for (const block of itemBlocks(xml)) {
    const title = decodeEntities(tagText(block, "title"));
    const url = tagText(block, "link");
    if (!title || !url) continue;

    const rawBody = tagText(block, "content:encoded") || tagText(block, "description");
    let body = stripHtml(rawBody);
    // WordPress boilerplate: leading repeat of the title, trailing "The post
    // … appeared first on …" line.
    if (body.startsWith(title)) body = body.slice(title.length).trimStart();
    body = body.replace(/The post [\s\S]* appeared first on [\s\S]*$/, "").trim();

    out.push({
      source: "embassy",
      title,
      body,
      url,
      level: null,
      regions: tagRegions(`${title}\n${body}`),
      publishedAt: parseDate(tagText(block, "pubDate")),
    });
  }
  return out;
}

/* ------------------------------ refresh + read ------------------------------ */

export type RefreshResult = {
  state: "ok" | "failed";
  embassy: "ok" | "failed";
  /** Rows that were not in the table before this refresh (for notifications). */
  newItems: ExternalAdvisory[];
};

async function upsertItems(items: ParsedItem[]): Promise<ExternalAdvisory[]> {
  if (items.length === 0) return [];
  const urls = items.map((i) => i.url);
  const existing = await db
    .select({ url: externalAdvisories.url })
    .from(externalAdvisories)
    .where(inArray(externalAdvisories.url, urls));
  const known = new Set(existing.map((e) => e.url));

  const fresh: ExternalAdvisory[] = [];
  for (const item of items) {
    const [row] = await db
      .insert(externalAdvisories)
      .values({ ...item, fetchedAt: new Date() })
      .onConflictDoUpdate({
        target: externalAdvisories.url,
        set: {
          title: item.title,
          body: item.body,
          level: item.level,
          regions: item.regions,
          publishedAt: item.publishedAt,
          fetchedAt: new Date(),
        },
      })
      .returning();
    if (!known.has(item.url)) fresh.push(row);
  }
  return fresh;
}

/**
 * Plain-https GET for hosts whose response headers overflow undici's 16 KB
 * limit (it.usembassy.gov does — fetch() throws UND_ERR_HEADERS_OVERFLOW and
 * offers no per-request override). Follows up to 3 redirects.
 */
function fetchWithBigHeaders(url: string, hops = 0): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      url,
      { headers: FETCH_HEADERS, maxHeaderSize: 128 * 1024, timeout: 20000 },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400 && res.headers.location && hops < 3) {
          res.resume();
          resolve(fetchWithBigHeaders(new URL(res.headers.location, url).href, hops + 1));
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => resolve({ status, body: Buffer.concat(chunks).toString("utf8") }));
        res.on("error", reject);
      },
    );
    req.on("timeout", () => req.destroy(new Error("timed out")));
    req.on("error", reject);
    req.end();
  });
}

/** True when this source was successfully fetched within the last 6 hours. */
async function recentlyFetched(source: "embassy" | "state_advisory"): Promise<boolean> {
  const [row] = await db
    .select({ last: sql<string | null>`max(${externalAdvisories.fetchedAt})` })
    .from(externalAdvisories)
    .where(eq(externalAdvisories.source, source));
  return !!row?.last && Date.now() - new Date(row.last).getTime() < REVALIDATE_SECONDS * 1000;
}

async function refreshStateFeed(force: boolean): Promise<{ ok: boolean; newItems: ExternalAdvisory[] }> {
  try {
    const res = await fetch(STATE_FEED_URL, {
      headers: FETCH_HEADERS,
      ...(force ? { cache: "no-store" as const } : { next: { revalidate: REVALIDATE_SECONDS } }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = parseStateFeed(await res.text());
    // Zero items from a 200 response means the layout changed under us —
    // treat as a parse failure so the last good copy stays.
    if (items.length === 0) throw new Error("no items parsed");
    return { ok: true, newItems: await upsertItems(items) };
  } catch (err) {
    console.error(`[us-advisories] refresh failed for ${STATE_FEED_URL}:`, err);
    return { ok: false, newItems: [] };
  }
}

async function refreshEmbassyFeed(force: boolean): Promise<{ ok: boolean; newItems: ExternalAdvisory[] }> {
  try {
    // No Next fetch cache on this path (plain https), so the 6-hour cadence
    // is enforced against the table's own fetched_at timestamps.
    if (!force && (await recentlyFetched("embassy"))) return { ok: true, newItems: [] };
    const res = await fetchWithBigHeaders(EMBASSY_FEED_URL);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const items = parseEmbassyFeed(res.body);
    if (items.length === 0) throw new Error("no items parsed");
    return { ok: true, newItems: await upsertItems(items) };
  } catch (err) {
    console.error(`[us-advisories] refresh failed for ${EMBASSY_FEED_URL}:`, err);
    return { ok: false, newItems: [] };
  }
}

/**
 * Refreshes both feeds. Never throws; on failure the DB keeps the last good
 * copy. `force: true` (cron) bypasses the 6-hour fetch cache.
 */
export async function refreshUsAdvisories(opts: { force?: boolean } = {}): Promise<RefreshResult> {
  const force = opts.force ?? false;
  const [state, embassy] = await Promise.all([refreshStateFeed(force), refreshEmbassyFeed(force)]);
  return {
    state: state.ok ? "ok" : "failed",
    embassy: embassy.ok ? "ok" : "failed",
    newItems: [...state.newItems, ...embassy.newItems],
  };
}

export type UsAdvisories = {
  /** The current Italy Travel Advisory (level + body), if ever fetched. */
  advisory: ExternalAdvisory | null;
  /** Everything, newest first (embassy alerts + state items). */
  items: ExternalAdvisory[];
  /** When any source was last successfully checked. */
  lastCheckedAt: string | null;
  /** True when the newest successful check is over 12 h old. */
  stale: boolean;
};

export async function getUsAdvisories(): Promise<UsAdvisories> {
  const rows = await db
    .select()
    .from(externalAdvisories)
    .orderBy(sql`coalesce(${externalAdvisories.publishedAt}, ${externalAdvisories.fetchedAt}) desc`)
    .limit(100);

  const advisory =
    rows
      .filter((r) => r.source === "state_advisory")
      .sort((a, b) => +b.fetchedAt - +a.fetchedAt)[0] ?? null;

  const lastChecked = rows.reduce<Date | null>(
    (max, r) => (max === null || r.fetchedAt > max ? r.fetchedAt : max),
    null,
  );

  return {
    advisory,
    items: rows,
    lastCheckedAt: lastChecked ? lastChecked.toISOString() : null,
    stale: lastChecked ? Date.now() - +lastChecked > 12 * 60 * 60 * 1000 : true,
  };
}
