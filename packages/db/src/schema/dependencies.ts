import { pgTable, uuid, text, pgEnum, timestamp, index } from "drizzle-orm/pg-core";
import { repositories } from "./repositories.js";
import { files } from "./files.js";

export const dependencyTypeEnum = pgEnum("dependency_type", [
  "import",
  "require",
  "extends",
  "implements",
  "calls",
  "package",
]);

export const dependencies = pgTable(
  "dependencies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    repositoryId: uuid("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    sourceFileId: uuid("source_file_id")
      .notNull()
      .references(() => files.id, { onDelete: "cascade" }),
    targetFileId: uuid("target_file_id").references(() => files.id, { onDelete: "cascade" }),
    dependencyType: dependencyTypeEnum("dependency_type").notNull(),
    targetName: text("target_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("deps_repo_idx").on(table.repositoryId),
    index("deps_source_idx").on(table.sourceFileId),
  ],
);
