import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const interviews = sqliteTable("interviews", {
  id: integer("id").primaryKey({autoIncrement:true}), applicationId: integer("application_id").notNull(),
  startsAt: text("starts_at").notNull(), duration: integer("duration").notNull().default(60),
  location: text("location"), notes: text("notes"),
});
export const applicationMerges = sqliteTable("application_merges", {
  sourceId: integer("source_id").primaryKey(), targetId: integer("target_id").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const applications = sqliteTable("applications", {
  deletedAt: text("deleted_at"),
  id: integer("id").primaryKey({ autoIncrement: true }), company: text("company").notNull(), role: text("role").notNull(), track: text("track").notNull().default("other"), location: text("location"), score: integer("score").notNull().default(50), status: text("status").notNull().default("saved"), deadline: text("deadline"), url: text("url"), notes: text("notes"), source: text("source"), appliedOn: text("applied_on"), contactName: text("contact_name"), contactEmail: text("contact_email"), contactPhone: text("contact_phone"), lastContactOn: text("last_contact_on"), nextAction: text("next_action"), nextActionDate: text("next_action_date"), feedback: text("feedback"), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }), title: text("title").notNull(), category: text("category").notNull().default("Kariyer"), estimate: text("estimate").notNull().default("30 dk"), done: integer("done").notNull().default(0), sortOrder: integer("sort_order").notNull().default(0), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const applicationSteps = sqliteTable("application_steps", {
  id: integer("id").primaryKey({ autoIncrement: true }), applicationId: integer("application_id").notNull(), label: text("label").notNull(), done: integer("done").notNull().default(0), sortOrder: integer("sort_order").notNull().default(0), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const applicationUpdates = sqliteTable("application_updates", {
  id: integer("id").primaryKey({ autoIncrement: true }), applicationId: integer("application_id").notNull(), updateType: text("update_type").notNull().default("Not"), title: text("title").notNull(), body: text("body"), happenedOn: text("happened_on").notNull().default(sql`CURRENT_DATE`), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});
