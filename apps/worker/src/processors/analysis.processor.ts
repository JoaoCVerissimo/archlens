import { eq } from "drizzle-orm";
import type { Job } from "bullmq";
import { analyses, repositories } from "@archlens/db";
import type { Database } from "@archlens/db";
import type { LanguageBreakdown } from "@archlens/shared";
import { ClaudeClient } from "../ai/client.js";
import { runAnalysisPipeline } from "../ai/pipeline.js";
import type { WorkerConfig } from "../config.js";

export interface AnalysisJobData {
  analysisId: string;
}

export async function processAnalysis(
  job: Job<AnalysisJobData>,
  db: Database,
  config: WorkerConfig,
): Promise<void> {
  const { analysisId } = job.data;

  const [analysis] = await db
    .select()
    .from(analyses)
    .where(eq(analyses.id, analysisId))
    .limit(1);
  if (!analysis) throw new Error(`Analysis ${analysisId} not found`);

  const [repo] = await db
    .select()
    .from(repositories)
    .where(eq(repositories.id, analysis.repositoryId))
    .limit(1);
  if (!repo) throw new Error(`Repository ${analysis.repositoryId} not found`);
  if (!repo.localPath) throw new Error(`Repository has no local path`);

  if (!config.anthropicApiKey) {
    await db
      .update(analyses)
      .set({ status: "failed", errorMessage: "ANTHROPIC_API_KEY is not configured" })
      .where(eq(analyses.id, analysisId));
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const claude = new ClaudeClient(
    config.anthropicApiKey,
    analysis.modelUsed ?? undefined,
  );

  const languages = ((repo.languages as LanguageBreakdown[] | null) ?? []).map((l) => l.name);

  try {
    await runAnalysisPipeline(
      db,
      claude,
      analysisId,
      repo.localPath,
      repo.name,
      languages,
    );
    job.log(`Analysis ${analysisId} completed`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db
      .update(analyses)
      .set({ status: "failed", errorMessage: message })
      .where(eq(analyses.id, analysisId));
    throw error;
  }
}
