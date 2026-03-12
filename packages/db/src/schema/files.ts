import { pgTable, uuid, varchar, text, integer, jsonb, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { repositories } from "./repositories.js";

export const files = pgTable(
  "files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    repositoryId: uuid("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    path: text("path").notNull(),
    language: varchar("language", { length: 50 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    lineCount: integer("line_count").notNull(),
    hash: varchar("hash", { length: 64 }).notNull(),
    symbols: jsonb("symbols"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("files_repo_path_idx").on(table.repositoryId, table.path),
  ],
);
