import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const applications = sqliteTable("applications", {
  id: integer("id").primaryKey({ autoIncrement: true }), company: text("company").notNull(), role: text("role").notNull(), track: text("track").notNull().default("other"), location: text("location"), score: integer("score").notNull().default(50), status: text("status").notNull().default("saved"), deadline: text("deadline"), url: text("url"), notes: text("notes"), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }), title: text("title").notNull(), category: text("category").notNull().default("Kariyer"), estimate: text("estimate").notNull().default("30 dk"), done: integer("done").notNull().default(0), sortOrder: integer("sort_order").notNull().default(0), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});
