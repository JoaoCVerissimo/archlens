import { pgTable, uuid, varchar, text, pgEnum, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { analyses } from "./analyses.js";

export const findingCategoryEnum = pgEnum("finding_category", [
  "pattern",
  "anti_pattern",
  "security",
  "scalability",
  "complexity",
  "tech_debt",
  "suggestion",
]);

export const severityEnum = pgEnum("severity", [
  "info",
  "low",
  "medium",
  "high",
  "critical",
]);

export const findings = pgTable(
  "findings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    analysisId: uuid("analysis_id")
      .notNull()
      .references(() => analyses.id, { onDelete: "cascade" }),
    category: findingCategoryEnum("category").notNull(),
    severity: severityEnum("severity").notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description").notNull(),
    filePaths: jsonb("file_paths"),
    codeSnippet: text("code_snippet"),
    suggestion: text("suggestion"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("findings_analysis_idx").on(table.analysisId),
    index("findings_category_idx").on(table.category),
    index("findings_severity_idx").on(table.severity),
  ],
);
