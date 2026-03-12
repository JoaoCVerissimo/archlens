import { join } from "node:path";
import { mkdir, rm } from "node:fs/promises";
import { eq } from "drizzle-orm";
import type { Job } from "bullmq";
import { Queue } from "bullmq";
import { repositories } from "@archlens/db";
import type { Database } from "@archlens/db";
import { cloneRepository } from "../lib/git.js";

export interface IngestionJobData {
  repositoryId: string;
}

export async function processIngestion(
  job: Job<IngestionJobData>,
  db: Database,
  redisUrl: string,
  storagePath: string,
): Promise<void> {
  const { repositoryId } = job.data;

  // Get repository
  const [repo] = await db
    .select()
    .from(repositories)
    .where(eq(repositories.id, repositoryId))
    .limit(1);

  if (!repo) throw new Error(`Repository ${repositoryId} not found`);

  // Update status
  await db
    .update(repositories)
    .set({ status: "cloning", updatedAt: new Date() })
    .where(eq(repositories.id, repositoryId));

  const destPath = join(storagePath, repositoryId);

  try {
    // Clean existing directory if it exists
    await rm(destPath, { recursive: true, force: true });
    await mkdir(destPath, { recursive: true });

    if (repo.sourceType === "github" && repo.sourceUrl) {
      await cloneRepository(repo.sourceUrl, destPath, repo.branch);
    } else if (repo.sourceType === "zip") {
      // ZIP extraction is handled during upload via multipart
      // For now, assume the zip has been extracted to destPath
    } else if (repo.sourceType === "local") {
      // Local repos are assumed to already be at the path
    }

    // Update status to cloned
    await db
      .update(repositories)
      .set({
        status: "cloned",
        localPath: destPath,
        updatedAt: new Date(),
      })
      .where(eq(repositories.id, repositoryId));

    // Enqueue indexing job
    const indexingQueue = new Queue("indexing", { connection: { url: redisUrl } });
    await indexingQueue.add("index", { repositoryId }, { jobId: `index-${repositoryId}` });
    await indexingQueue.close();

    job.log(`Repository ${repo.name} cloned to ${destPath}`);
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
