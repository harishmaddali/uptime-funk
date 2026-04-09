import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";

export const defaultNotification = sqliteTable("default_notification", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  email: integer("email", { mode: "boolean" }).notNull().default(true),
  sms: integer("sms", { mode: "boolean" }).notNull().default(false),
  slack: integer("slack", { mode: "boolean" }).notNull().default(false),
  telegram: integer("telegram", { mode: "boolean" }).notNull().default(false),
});

export const integration = sqliteTable(
  "integration",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    config: text("config").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("integration_userId_idx").on(table.userId),
    uniqueIndex("integration_userId_type_idx").on(table.userId, table.type),
  ]
);

export const monitor = sqliteTable(
  "monitor",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    url: text("url").notNull(),
    method: text("method").notNull().default("GET"),
    expectedStatus: integer("expected_status").notNull().default(200),
    expectedBody: text("expected_body"),
    intervalSeconds: integer("interval_seconds").notNull().default(300),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    useCustomNotify: integer("use_custom_notify", { mode: "boolean" })
      .notNull()
      .default(false),
    notifyEmail: integer("notify_email", { mode: "boolean" }),
    notifySms: integer("notify_sms", { mode: "boolean" }),
    notifySlack: integer("notify_slack", { mode: "boolean" }),
    notifyTelegram: integer("notify_telegram", { mode: "boolean" }),
    status: text("status").notNull().default("unknown"),
    lastCheckedAt: integer("last_checked_at", { mode: "timestamp_ms" }),
    lastResponseTimeMs: integer("last_response_time_ms"),
    lastError: text("last_error"),
    consecutiveFailures: integer("consecutive_failures").notNull().default(0),
    publicSlug: text("public_slug").unique(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("monitor_userId_idx").on(table.userId)]
);

export const monitorCheck = sqliteTable(
  "monitor_check",
  {
    id: text("id").primaryKey(),
    monitorId: text("monitor_id")
      .notNull()
      .references(() => monitor.id, { onDelete: "cascade" }),
    ok: integer("ok", { mode: "boolean" }).notNull(),
    statusCode: integer("status_code"),
    responseTime: integer("response_time"),
    error: text("error"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("monitor_check_monitorId_createdAt_idx").on(
      table.monitorId,
      table.createdAt
    ),
  ]
);

