import { pgTable, uuid, varchar, text, integer, pgEnum, jsonb, timestamp } from "drizzle-orm/pg-core";
import { repositories } from "./repositories.js";

export const analysisTypeEnum = pgEnum("analysis_type", [
  "architecture",
  "code_quality",
  "security",
  "dependencies",
  "full",
]);

export const analysisStatusEnum = pgEnum("analysis_status", [
  "queued",
  "processing",
  "chunking",
  "analyzing",
  "synthesizing",
  "completed",
  "failed",
]);

export const chunkStatusEnum = pgEnum("chunk_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const analyses = pgTable("analyses", {
  id: uuid("id").primaryKey().defaultRandom(),
  repositoryId: uuid("repository_id")
    .notNull()
    .references(() => repositories.id, { onDelete: "cascade" }),
  analysisType: analysisTypeEnum("analysis_type").notNull(),
  status: analysisStatusEnum("analysis_status").default("queued").notNull(),
  progress: integer("progress").default(0).notNull(),
  totalChunks: integer("total_chunks"),
  completedChunks: integer("completed_chunks"),
  modelUsed: varchar("model_used", { length: 100 }),
  totalTokensUsed: integer("total_tokens_used"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const analysisChunks = pgTable("analysis_chunks", {
  id: uuid("id").primaryKey().defaultRandom(),
  analysisId: uuid("analysis_id")
    .notNull()
    .references(() => analyses.id, { onDelete: "cascade" }),
  chunkIndex: integer("chunk_index").notNull(),
  moduleName: varchar("module_name", { length: 255 }).notNull(),
  filePaths: jsonb("file_paths").notNull(),
  promptTokens: integer("prompt_tokens"),
  completionTokens: integer("completion_tokens"),
  rawResponse: jsonb("raw_response"),
  parsedResult: jsonb("parsed_result"),
  status: chunkStatusEnum("chunk_status").default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
