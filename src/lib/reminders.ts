/**
 * Check-in reminders and the admin escalation safety net. Server-side only;
 * invoked by the cron endpoint every ~15 minutes.
 *
 * Per user with a reminder interval set (4/8/24 h):
 *  - Interval elapsed since their last check-in (auto check-ins count —
 *    they're presence signals) → push a reminder, at most once per interval.
 *  - Reminder unanswered for 60+ minutes → notify every admin once with the
 *    user's name and last known check-in time/place. That escalation is the
 *    point of the feature: a silent traveler gets human attention.
 */
import { desc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { checkIns, users } from "@/db/schema";
import { sendPush } from "@/lib/push";

const ESCALATE_AFTER_MS = 60 * 60 * 1000;

function describeLastCheckIn(last: typeof checkIns.$inferSelect | undefined): string {
  if (!last) return "has never checked in";
  const when = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Rome",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(last.createdAt);
  const where = last.placeName
    ? ` at ${last.placeName}`
    : last.lat != null && last.lng != null
      ? ` at ${last.lat.toFixed(4)}, ${last.lng.toFixed(4)}`
      : "";
  return `last checked in ${when} (Italy time)${where}`;
}

export async function runCheckinReminders(): Promise<{ reminded: number; escalated: number }> {
  const now = Date.now();
  let reminded = 0;
  let escalated = 0;

  const candidates = await db.select().from(users).where(gt(users.checkinReminderHours, 0));
  if (candidates.length === 0) return { reminded, escalated };

  const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));

  for (const user of candidates) {
    try {
      const [last] = await db
        .select()
        .from(checkIns)
        .where(eq(checkIns.userId, user.id))
        .orderBy(desc(checkIns.createdAt))
        .limit(1);

      // Users who never checked in are measured from account creation.
      const lastActivity = last?.createdAt ?? user.createdAt;
      const intervalMs = user.checkinReminderHours * 3_600_000;
      if (now - +lastActivity < intervalMs) continue;

      const reminderOutstanding = user.lastReminderAt !== null && +user.lastReminderAt > +lastActivity;

      if (!reminderOutstanding || now - +user.lastReminderAt! >= intervalMs) {
        // First reminder for this silence, or re-remind after a full interval.
        await sendPush(
          "reminders",
          {
            title: "Time to check in",
            body: `Nothing from you in ${user.checkinReminderHours}+ hours. One tap to say you're safe.`,
            url: "/checkin",
            tag: "checkin-reminder",
          },
          [user.id],
        );
        await db.update(users).set({ lastReminderAt: new Date() }).where(eq(users.id, user.id));
        reminded += 1;
        continue;
      }

      const alreadyEscalated =
        user.lastEscalationAt !== null && +user.lastEscalationAt >= +user.lastReminderAt!;
      if (now - +user.lastReminderAt! >= ESCALATE_AFTER_MS && !alreadyEscalated) {
        // Escalations bypass notification preferences on purpose (pref null):
        // a safety net that can be muted isn't one.
        await sendPush(
          null,
          {
            title: `Overdue: ${user.name} hasn't checked in`,
            body: `No response to a reminder for over an hour. ${user.name} ${describeLastCheckIn(last)}.`,
            url: "/alerts",
            tag: `checkin-escalation-${user.id}`,
          },
          admins.map((a) => a.id),
        );
        await db.update(users).set({ lastEscalationAt: new Date() }).where(eq(users.id, user.id));
        escalated += 1;
      }
    } catch (err) {
      console.error(`[reminders] failed for user ${user.id}:`, err);
    }
  }

  return { reminded, escalated };
}
