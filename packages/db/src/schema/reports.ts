import { pgTable, uuid, varchar, text, pgEnum, jsonb, timestamp } from "drizzle-orm/pg-core";
import { analyses } from "./analyses.js";
import { repositories } from "./repositories.js";

export const reportTypeEnum = pgEnum("report_type", [
  "architecture_overview",
  "full_review",
  "onboarding",
  "tech_debt",
]);

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  analysisId: uuid("analysis_id")
    .notNull()
    .references(() => analyses.id, { onDelete: "cascade" }),
  repositoryId: uuid("repository_id")
    .notNull()
    .references(() => repositories.id, { onDelete: "cascade" }),
  reportType: reportTypeEnum("report_type").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  sections: jsonb("sections").notNull(),
  summary: text("summary").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
