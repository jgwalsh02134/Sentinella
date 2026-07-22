import {
  boolean,
  doublePrecision,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["traveler", "admin"]);
export const checkInStatus = pgEnum("check_in_status", ["safe", "caution", "help"]);
export const alertSeverity = pgEnum("alert_severity", ["info", "advisory", "critical"]);

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

export type User = typeof users.$inferSelect;
export type CheckIn = typeof checkIns.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
