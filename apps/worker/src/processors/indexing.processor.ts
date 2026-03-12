import { eq, sql } from "drizzle-orm";
import type { Job } from "bullmq";
import { Queue } from "bullmq";
import { repositories, files, dependencies } from "@archlens/db";
import type { Database } from "@archlens/db";
import type { LanguageBreakdown, RepositoryStats } from "@archlens/shared";
import { walkDirectory } from "../lib/file-walker.js";
import { getParser } from "../parsers/parser.factory.js";

export interface IndexingJobData {
  repositoryId: string;
}

export async function processIndexing(
  job: Job<IndexingJobData>,
  db: Database,
  redisUrl: string,
): Promise<void> {
  const { repositoryId } = job.data;

  const [repo] = await db
    .select()
    .from(repositories)
    .where(eq(repositories.id, repositoryId))
    .limit(1);

  if (!repo) throw new Error(`Repository ${repositoryId} not found`);
  if (!repo.localPath) throw new Error(`Repository ${repositoryId} has no local path`);

  await db
    .update(repositories)
    .set({ status: "indexing", updatedAt: new Date() })
    .where(eq(repositories.id, repositoryId));

  try {
    // Clear old file records
    await db.delete(files).where(eq(files.repositoryId, repositoryId));
    await db.delete(dependencies).where(eq(dependencies.repositoryId, repositoryId));

    // Walk directory and index files
    const walkedFiles = await walkDirectory(repo.localPath);
    job.log(`Found ${walkedFiles.length} source files`);

    // Insert files in batches
    const batchSize = 100;
    for (let i = 0; i < walkedFiles.length; i += batchSize) {
      const batch = walkedFiles.slice(i, i + batchSize);
      await db.insert(files).values(
        batch.map((f) => {
          const parser = getParser(f.language);
          const symbols = parser.extractSymbols(f.content, f.path);
          return {
            repositoryId,
            path: f.path,
            language: f.language,
            sizeBytes: f.sizeBytes,
            lineCount: f.lineCount,
            hash: f.hash,
            symbols,
          };
        }),
      );
      await job.updateProgress(Math.round(((i + batch.length) / walkedFiles.length) * 80));
    }

    // Compute language breakdown
    const langMap = new Map<string, { count: number; lines: number }>();
    for (const f of walkedFiles) {
      const entry = langMap.get(f.language) ?? { count: 0, lines: 0 };
      entry.count++;
      entry.lines += f.lineCount;
      langMap.set(f.language, entry);
    }
    const totalLines = walkedFiles.reduce((sum, f) => sum + f.lineCount, 0);
    const languages: LanguageBreakdown[] = [...langMap.entries()]
      .map(([name, { count, lines }]) => ({
        name,
        percentage: Math.round((lines / totalLines) * 100),
        fileCount: count,
      }))
      .sort((a, b) => b.percentage - a.percentage);

    const stats: RepositoryStats = {
      totalFiles: walkedFiles.length,
      totalLines,
      totalSizeBytes: walkedFiles.reduce((sum, f) => sum + f.sizeBytes, 0),
    };

    // Build internal dependencies
    const indexedFiles = await db
      .select()
      .from(files)
      .where(eq(files.repositoryId, repositoryId));

    const pathToId = new Map(indexedFiles.map((f) => [f.path, f.id]));

    const depRecords: Array<{
      repositoryId: string;
      sourceFileId: string;
      targetFileId: string | null;
      dependencyType: "import" | "require";
      targetName: string;
    }> = [];

    for (const file of indexedFiles) {
      const symbols = file.symbols as any;
      if (!symbols?.imports) continue;

      for (const imp of symbols.imports) {
        const source: string = imp.source;
        // Try to resolve relative imports
        if (source.startsWith(".")) {
          const resolvedPaths = resolveImportPath(file.path, source);
          let targetId: string | null = null;
          for (const rp of resolvedPaths) {
            if (pathToId.has(rp)) {
              targetId = pathToId.get(rp)!;
              break;
            }
          }
          depRecords.push({
            repositoryId,
            sourceFileId: file.id,
            targetFileId: targetId,
            dependencyType: "import",
            targetName: source,
          });
        } else {
          // External dependency
          depRecords.push({
            repositoryId,
            sourceFileId: file.id,
            targetFileId: null,
            dependencyType: "import",
            targetName: source,
          });
        }
      }
    }

    // Insert dependencies in batches
    for (let i = 0; i < depRecords.length; i += batchSize) {
      const batch = depRecords.slice(i, i + batchSize);
      if (batch.length > 0) {
        await db.insert(dependencies).values(batch);
      }
    }

    await job.updateProgress(100);

    // Update repository with stats
    await db
      .update(repositories)
      .set({
        status: "indexed",
        languages,
        stats,
        updatedAt: new Date(),
      })
      .where(eq(repositories.id, repositoryId));

    job.log(`Indexed ${walkedFiles.length} files, ${depRecords.length} dependencies`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db
      .update(repositories)
      .set({
        status: "failed",
        errorMessage: message,
        updatedAt: new Date(),
      })
      .where(eq(repositories.id, repositoryId));
    throw error;
  }
}

function resolveImportPath(fromPath: string, importSource: string): string[] {
  const dir = fromPath.split("/").slice(0, -1).join("/");
  const resolved = importSource.startsWith("./")
    ? `${dir}/${importSource.slice(2)}`
    : importSource.startsWith("../")
      ? resolveRelative(dir, importSource)
      : importSource;

  // Try common extensions and index files
  return [
    resolved,
    `${resolved}.ts`,
    `${resolved}.tsx`,
    `${resolved}.js`,
    `${resolved}.jsx`,
    `${resolved}/index.ts`,
    `${resolved}/index.tsx`,
    `${resolved}/index.js`,
  ];
}

function resolveRelative(dir: string, importPath: string): string {
  const parts = dir.split("/");
  const importParts = importPath.split("/");
  for (const part of importParts) {
    if (part === "..") parts.pop();
    else if (part !== ".") parts.push(part);
  }
  return parts.join("/");
}
