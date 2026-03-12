import { eq } from "drizzle-orm";
import { analyses, analysisChunks, findings, files, dependencies } from "@archlens/db";
import type { Database } from "@archlens/db";
import type { ModuleAnalysisResult, ArchitectureSynthesis, FindingCategory, SeverityLevel } from "@archlens/shared";
import { parseClaudeJson, MAX_CONCURRENT_ANALYSIS, FAILURE_THRESHOLD } from "@archlens/shared";
import { ClaudeClient } from "./client.js";
import { chunkCodebase, type CodeChunk } from "./chunker.js";
import { buildModuleAnalysisPrompt } from "./prompts/module-analysis.js";
import { buildSynthesisPrompt } from "./prompts/synthesis.js";

export async function runAnalysisPipeline(
  db: Database,
  claude: ClaudeClient,
  analysisId: string,
  repoPath: string,
  repoName: string,
  languages: string[],
): Promise<void> {
  // Update status
  await db
    .update(analyses)
    .set({ status: "chunking", startedAt: new Date() })
    .where(eq(analyses.id, analysisId));

  // Get all indexed files with content
  const [analysis] = await db.select().from(analyses).where(eq(analyses.id, analysisId)).limit(1);
  if (!analysis) throw new Error(`Analysis ${analysisId} not found`);

  const indexedFiles = await db
    .select()
    .from(files)
    .where(eq(files.repositoryId, analysis.repositoryId));

  // Read file contents
  const { readFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const fileContents = await Promise.all(
    indexedFiles.map(async (f) => {
      try {
        const content = await readFile(join(repoPath, f.path), "utf-8");
        return { path: f.path, language: f.language, lineCount: f.lineCount, content };
      } catch {
        return null;
      }
    }),
  );
  const validFiles = fileContents.filter((f): f is NonNullable<typeof f> => f !== null);

  // Chunk the codebase
  const chunks = chunkCodebase(validFiles);

  // Create chunk records
  const chunkRecords = await Promise.all(
    chunks.map(async (chunk, index) => {
      const [record] = await db
        .insert(analysisChunks)
        .values({
          analysisId,
          chunkIndex: index,
          moduleName: chunk.moduleName,
          filePaths: chunk.files.map((f) => f.path),
        })
        .returning();
      return { record, chunk };
    }),
  );

  await db
    .update(analyses)
    .set({
      status: "analyzing",
      totalChunks: chunks.length,
      completedChunks: 0,
    })
    .where(eq(analyses.id, analysisId));

  // Process chunks with concurrency limit
  let completedCount = 0;
  let failedCount = 0;
  let totalTokens = 0;

  const processChunk = async (item: (typeof chunkRecords)[number]) => {
    const { record, chunk } = item;
    try {
      await db
        .update(analysisChunks)
        .set({ status: "processing" })
        .where(eq(analysisChunks.id, record.id));

      const prompt = buildModuleAnalysisPrompt(
        chunk,
        repoName,
        languages,
        "See file imports for dependency information",
      );

      const response = await claude.analyze(prompt.system, prompt.user);
      const parsed = parseClaudeJson<ModuleAnalysisResult>(response.content);

      await db
        .update(analysisChunks)
        .set({
          status: "completed",
          rawResponse: response.content,
          parsedResult: parsed,
          promptTokens: response.promptTokens,
          completionTokens: response.completionTokens,
        })
        .where(eq(analysisChunks.id, record.id));

      totalTokens += response.promptTokens + response.completionTokens;
      completedCount++;
    } catch (error) {
      failedCount++;
      await db
        .update(analysisChunks)
        .set({ status: "failed" })
        .where(eq(analysisChunks.id, record.id));
      console.error(`Chunk ${chunk.moduleName} failed:`, error);
    }

    // Update progress
    const progress = Math.round(
      ((completedCount + failedCount) / chunks.length) * 80,
    );
    await db
      .update(analyses)
      .set({ progress, completedChunks: completedCount })
      .where(eq(analyses.id, analysisId));
  };

  // Process with concurrency limit
  const pool: Promise<void>[] = [];
  for (const item of chunkRecords) {
    const p = processChunk(item);
    pool.push(p);
    if (pool.length >= MAX_CONCURRENT_ANALYSIS) {
      await Promise.race(pool);
      // Remove completed promises
      for (let i = pool.length - 1; i >= 0; i--) {
        const status = await Promise.race([pool[i].then(() => "done"), Promise.resolve("pending")]);
        if (status === "done") pool.splice(i, 1);
      }
    }
  }
  await Promise.all(pool);

  // Check failure threshold
  if (failedCount / chunks.length > FAILURE_THRESHOLD) {
    await db
      .update(analyses)
      .set({
        status: "failed",
        errorMessage: `Too many chunks failed: ${failedCount}/${chunks.length}`,
        totalTokensUsed: totalTokens,
      })
      .where(eq(analyses.id, analysisId));
    return;
  }

  // Synthesis step
  await db
    .update(analyses)
    .set({ status: "synthesizing", progress: 85 })
    .where(eq(analyses.id, analysisId));

  const completedChunks = await db
    .select()
    .from(analysisChunks)
    .where(eq(analysisChunks.analysisId, analysisId));

  const moduleResults = completedChunks
    .filter((c) => c.status === "completed" && c.parsedResult)
    .map((c) => c.parsedResult as unknown as ModuleAnalysisResult);

  const totalLines = validFiles.reduce((sum, f) => sum + f.lineCount, 0);

  const synthPrompt = buildSynthesisPrompt(
    repoName,
    languages,
    validFiles.length,
    totalLines,
    moduleResults,
    `${indexedFiles.length} files with cross-module dependencies`,
  );

  const synthResponse = await claude.analyze(synthPrompt.system, synthPrompt.user);
  const synthesis = parseClaudeJson<ArchitectureSynthesis>(synthResponse.content);
  totalTokens += synthResponse.promptTokens + synthResponse.completionTokens;

  // Extract findings from synthesis
  const findingsToInsert: Array<{
    analysisId: string;
    category: FindingCategory;
    severity: SeverityLevel;
    title: string;
    description: string;
    filePaths: string[];
    suggestion: string | null;
    metadata: Record<string, unknown>;
  }> = [];

  for (const pattern of synthesis.identifiedPatterns) {
    findingsToInsert.push({
      analysisId,
      category: "pattern",
      severity: "info",
      title: pattern.name,
      description: `${pattern.description}\n\nAssessment: ${pattern.assessment}`,
      filePaths: [],
      suggestion: null,
      metadata: {},
    });
  }

  for (const problem of synthesis.potentialProblems) {
    findingsToInsert.push({
      analysisId,
      category: "anti_pattern",
      severity: (problem.severity as SeverityLevel) ?? "medium",
      title: problem.title,
      description: problem.description,
      filePaths: problem.affectedModules,
      suggestion: null,
      metadata: {},
    });
  }

  for (const issue of synthesis.securityIssues) {
    findingsToInsert.push({
      analysisId,
      category: "security",
      severity: (issue.severity as SeverityLevel) ?? "medium",
      title: issue.title,
      description: issue.description,
      filePaths: [],
      suggestion: issue.recommendation,
      metadata: {},
    });
  }

  for (const risk of synthesis.scalabilityRisks) {
    findingsToInsert.push({
      analysisId,
      category: "scalability",
      severity: "medium",
      title: risk.risk,
      description: `Current state: ${risk.currentState}`,
      filePaths: [],
      suggestion: risk.recommendation,
      metadata: {},
    });
  }

  for (const improvement of synthesis.suggestedImprovements) {
    findingsToInsert.push({
      analysisId,
      category: "suggestion",
      severity: "info",
      title: improvement.title,
      description: improvement.description,
      filePaths: [],
      suggestion: null,
      metadata: { priority: improvement.priority, effort: improvement.effort, impact: improvement.impact },
    });
  }

  // Insert findings
  if (findingsToInsert.length > 0) {
    await db.insert(findings).values(findingsToInsert);
  }

  // Mark analysis as completed
  await db
    .update(analyses)
    .set({
      status: "completed",
      progress: 100,
      totalTokensUsed: totalTokens,
      completedAt: new Date(),
    })
    .where(eq(analyses.id, analysisId));
}
