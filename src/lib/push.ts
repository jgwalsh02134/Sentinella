/**
 * Web Push delivery. Server-side only.
 *
 * VAPID keys come from VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT
 * (generate with `npx web-push generate-vapid-keys`). When they're not set,
 * every send is a logged no-op — notifications are an enhancement and must
 * never break publishing or feed refreshes.
 */
import webpush from "web-push";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  externalAdvisories,
  officialWarnings,
  pushSubscriptions,
  users,
  type ExternalAdvisory,
  type OfficialWarning,
} from "@/db/schema";

export type PushPayload = {
  title: string;
  body: string;
  /** In-app path the notification opens, e.g. "/alerts". */
  url: string;
  /** Collapse key: notifications with the same tag replace each other. */
  tag?: string;
};

export type NotifyPreference = "official" | "team" | "reminders";

const PREF_COLUMN = {
  official: users.notifyOfficial,
  team: users.notifyTeam,
  reminders: users.notifyReminders,
} as const;

let vapidConfigured = false;

function ensureVapid(): boolean {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    console.warn("[push] VAPID env vars not set; skipping send");
    return false;
  }
  if (!vapidConfigured) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    vapidConfigured = true;
  }
  return true;
}

/**
 * Sends to every subscription of users who opted into `pref` — all such
 * users, or only those in `userIds` when given. `pref: null` skips the
 * preference filter (used for admin safety escalations, which must not be
 * silenced by a preference). Dead subscriptions (endpoints answering
 * 404/410) are deleted. Never throws.
 */
export async function sendPush(
  pref: NotifyPreference | null,
  payload: PushPayload,
  userIds?: string[],
): Promise<{ sent: number; failed: number }> {
  if (!ensureVapid()) return { sent: 0, failed: 0 };
  if (userIds && userIds.length === 0) return { sent: 0, failed: 0 };

  const conditions = [
    ...(pref ? [eq(PREF_COLUMN[pref], true)] : []),
    ...(userIds ? [inArray(pushSubscriptions.userId, userIds)] : []),
  ];
  const rows = await db
    .select({
      id: pushSubscriptions.id,
      endpoint: pushSubscriptions.endpoint,
      keys: pushSubscriptions.keys,
    })
    .from(pushSubscriptions)
    .innerJoin(users, eq(pushSubscriptions.userId, users.id))
    .where(conditions.length ? and(...conditions) : undefined);

  const body = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;
  await Promise.all(
    rows.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, body);
        sent += 1;
      } catch (err) {
        failed += 1;
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id)).catch(() => undefined);
        } else {
          console.error(`[push] send failed (${status ?? "?"}) for ${sub.endpoint.slice(0, 60)}…`);
        }
      }
    }),
  );
  return { sent, failed };
}

/**
 * Notifies opted-in users about advisory items that have never been
 * notified. Dedupe lives in the table: rows are keyed by URL and
 * notified_at is stamped before sending, so re-running a refresh — or two
 * refreshes racing — never double-sends an item.
 */
export async function notifyNewAdvisories(items: ExternalAdvisory[]): Promise<void> {
  for (const item of items) {
    try {
      // Claim the row first; only the claimer sends.
      const claimed = await db
        .update(externalAdvisories)
        .set({ notifiedAt: new Date() })
        .where(and(eq(externalAdvisories.id, item.id), isNull(externalAdvisories.notifiedAt)))
        .returning({ id: externalAdvisories.id });
      if (claimed.length === 0) continue;

      const label = item.source === "embassy" ? "U.S. Embassy alert" : "U.S. State Dept";
      await sendPush("official", {
        title: `${label}: ${item.title}`.slice(0, 120),
        body: item.regions.length ? `Affects: ${item.regions.join(", ")}` : "Tap for details.",
        url: "/alerts",
        tag: item.url,
      });
    } catch (err) {
      console.error("[push] advisory notification failed:", err);
    }
  }
}

/**
 * The push bar for official warnings, deliberately high:
 *
 *   - NEW red (rosso) warnings — MeteoAlarm or GDACS
 *   - NEW earthquakes at M ≥ 4.5
 *
 * Yellow and orange NEVER push; they surface in-app only. Notification
 * fatigue is a safety failure: a traveler who has learned to swipe away
 * this app's notifications won't read the one that matters. Every push
 * from this function must mean "act now".
 *
 * Dedupe matches notifyNewAdvisories: notified_at is claimed exactly once
 * per row, so racing refreshes never double-send.
 */
export async function notifyNewWarnings(items: OfficialWarning[]): Promise<void> {
  const PUSH_QUAKE_MAGNITUDE = 4.5;
  const urgent = items.filter(
    (w) => w.severity === "red" || (w.source === "ingv" && (w.magnitude ?? 0) >= PUSH_QUAKE_MAGNITUDE),
  );

  for (const item of urgent) {
    try {
      const claimed = await db
        .update(officialWarnings)
        .set({ notifiedAt: new Date() })
        .where(and(eq(officialWarnings.id, item.id), isNull(officialWarnings.notifiedAt)))
        .returning({ id: officialWarnings.id });
      if (claimed.length === 0) continue;

      const label = item.source === "ingv" ? "Earthquake" : "Red weather warning";
      await sendPush("official", {
        title: `${label}: ${item.title}`.slice(0, 120),
        body: item.regions.length ? `Affects: ${item.regions.join(", ")}` : item.area,
        url: "/alerts",
        tag: item.externalId,
      });
    } catch (err) {
      console.error("[push] warning notification failed:", err);
    }
  }
}
