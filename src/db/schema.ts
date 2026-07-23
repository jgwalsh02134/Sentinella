import { sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  integer,
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

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull().default("traveler"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const checkIns = pgTable("check_ins", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: checkInStatus("status").notNull(),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  accuracyM: doublePrecision("accuracy_m"),
  placeName: text("place_name"),
  note: text("note"),
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
});

export type User = typeof users.$inferSelect;
export type CheckIn = typeof checkIns.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type ExternalAdvisory = typeof externalAdvisories.$inferSelect;
