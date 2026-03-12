import { pgTable, uuid, varchar, text, pgEnum, jsonb, timestamp } from "drizzle-orm/pg-core";

export const sourceTypeEnum = pgEnum("source_type", ["github", "zip", "local"]);

export const repositoryStatusEnum = pgEnum("repository_status", [
  "pending",
  "cloning",
  "cloned",
  "indexing",
  "indexed",
  "failed",
]);

export const repositories = pgTable("repositories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  sourceType: sourceTypeEnum("source_type").notNull(),
  sourceUrl: text("source_url"),
  branch: varchar("branch", { length: 255 }).default("main").notNull(),
  status: repositoryStatusEnum("status").default("pending").notNull(),
  languages: jsonb("languages"),
  stats: jsonb("stats"),
  localPath: text("local_path"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
