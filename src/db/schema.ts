import { sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["traveler", "admin"]);
export const checkInStatus = pgEnum("check_in_status", ["safe", "caution", "help"]);
export const alertSeverity = pgEnum("alert_severity", ["info", "advisory", "critical"]);
export const advisorySource = pgEnum("advisory_source", ["state_advisory", "state_rss", "embassy"]);
export const warningSource = pgEnum("warning_source", ["meteoalarm", "ingv", "gdacs"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull().default("traveler"),
  /** Notification preferences; delivery also requires a push subscription. */
  notifyOfficial: boolean("notify_official").notNull().default(true),
  notifyTeam: boolean("notify_team").notNull().default(true),
  notifyReminders: boolean("notify_reminders").notNull().default(true),
  /**
   * Token for the public /status/<token> page showing this user's latest
   * check-in. One active link per user: null = no link (revoked). The link
   * follows the person, not a single check-in row, so it never goes stale.
   */
  shareToken: text("share_token").unique(),
  /** Check-in reminder interval in hours: 0 = off, else 4/8/24. */
  checkinReminderHours: integer("checkin_reminder_hours").notNull().default(0),
  /** When the user was last push-reminded to check in. */
  lastReminderAt: timestamp("last_reminder_at", { withTimezone: true }),
  /** When admins were last escalated to about this user's silence. */
  lastEscalationAt: timestamp("last_escalation_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One row per browser/device push registration (a user may have several). */
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  /** { p256dh, auth } from PushSubscription.toJSON().keys */
  keys: jsonb("keys").$type<{ p256dh: string; auth: string }>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const checkIns = pgTable("check_ins", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  /**
   * Client-generated UUID for idempotency: the offline queue retries a
   * POST until it lands, and the unique index guarantees retries can
   * never create a second row. Null for legacy rows (unique indexes
   * ignore NULLs).
   */
  clientId: uuid("client_id").unique(),
  status: checkInStatus("status").notNull(),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  accuracyM: doublePrecision("accuracy_m"),
  placeName: text("place_name"),
  note: text("note"),
  /** True for check-ins posted automatically by trip tracking. */
  isAuto: boolean("is_auto").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const alerts = pgTable("alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  severity: alertSeverity("severity").notNull().default("info"),
  region: text("region").notNull().default("Nationwide"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Last-good copies of official U.S. government advisories (public-domain
 * content). Rows are upserted by URL on every refresh and never deleted when
 * they age out of the upstream feeds, so the app can serve stale-but-labeled
 * data when .gov sites are unreachable.
 */
export const externalAdvisories = pgTable("external_advisories", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: advisorySource("source").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  url: text("url").notNull().unique(),
  /** 1–4 for State Department advisory items; null for embassy alerts. */
  level: integer("level"),
  /** Region names from src/data/regions.ts detected in the text. */
  regions: text("regions")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  /**
   * When push notifications for this item were sent. Dedupe: rows are keyed
   * by URL and this is set exactly once, so feed refreshes never double-send.
   */
  notifiedAt: timestamp("notified_at", { withTimezone: true }),
});

/**
 * Official emergency warnings ingested from public feeds — MeteoAlarm
 * (Italy's civil-protection weather warnings via EUMETNET), INGV
 * earthquakes, and GDACS disaster events. Rows are upserted on the feed's
 * stable ID so refreshes never duplicate, and NOTHING in this table is
 * ever fabricated — every row is a parse of a real feed item.
 */
export const officialWarnings = pgTable("official_warnings", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: warningSource("source").notNull(),
  /** Stable per-feed ID: MeteoAlarm area+event key, INGV eventId, GDACS guid. */
  externalId: text("external_id").notNull().unique(),
  /** Hazard type: "High-temperature", "Thunderstorm", "earthquake", "flood"… */
  kind: text("kind").notNull(),
  /**
   * MeteoAlarm/GDACS color: yellow | orange | red. Null for earthquakes —
   * quakes carry magnitude instead; severity is never inferred.
   */
  severity: text("severity"),
  title: text("title").notNull(),
  /** Human area: "Toscana", "5 km SW Campello sul Clitunno (PG)", "Italy". */
  area: text("area").notNull(),
  /** Administrative region tags for filtering: Lazio, Toscana. */
  regions: text("regions")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  magnitude: doublePrecision("magnitude"),
  depthKm: doublePrecision("depth_km"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  onsetAt: timestamp("onset_at", { withTimezone: true }),
  /** Warnings vanish from the UI at expiry automatically (read-time filter). */
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  url: text("url").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  /** Push dedupe stamp — set exactly once, same pattern as advisories. */
  notifiedAt: timestamp("notified_at", { withTimezone: true }),
});

/**
 * One row per warning source recording the latest refresh attempt — the
 * UI's "checked Xm ago" and per-source error states need this even when a
 * source currently has zero warnings (the normal, good case).
 */
export const warningChecks = pgTable("warning_checks", {
  source: warningSource("source").primaryKey(),
  checkedAt: timestamp("checked_at", { withTimezone: true }).notNull().defaultNow(),
  ok: boolean("ok").notNull(),
  error: text("error"),
});

/**
 * Last-good Open-Meteo forecasts, one row per rounded-coordinate key
 * ("41.90,12.50"). Upserted on every successful fetch; when Open-Meteo is
 * unreachable the API serves this copy labeled with its age — weather
 * degrades to stale, never to blank.
 */
export const weatherCache = pgTable("weather_cache", {
  locationKey: text("location_key").primaryKey(),
  payload: jsonb("payload").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type CheckIn = typeof checkIns.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type ExternalAdvisory = typeof externalAdvisories.$inferSelect;
export type OfficialWarning = typeof officialWarnings.$inferSelect;
export type WarningCheck = typeof warningChecks.$inferSelect;
