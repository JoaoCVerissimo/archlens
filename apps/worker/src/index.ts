import { Worker } from "bullmq";
import { createDb } from "@archlens/db";
import { loadConfig } from "./config.js";
import { processIngestion, type IngestionJobData } from "./processors/ingestion.processor.js";
import { processIndexing, type IndexingJobData } from "./processors/indexing.processor.js";
import { processAnalysis, type AnalysisJobData } from "./processors/analysis.processor.js";
import { processReport, type ReportJobData } from "./processors/report.processor.js";

const config = loadConfig();
const db = createDb(config.databaseUrl);

console.log("Starting ArchLens worker...");

const ingestionWorker = new Worker<IngestionJobData>(
  "ingestion",
  async (job) => processIngestion(job, db, config.redisUrl, config.repoStoragePath),
  { connection: { url: config.redisUrl }, concurrency: 2 },
);

const indexingWorker = new Worker<IndexingJobData>(
  "indexing",
  async (job) => processIndexing(job, db, config.redisUrl),
  { connection: { url: config.redisUrl }, concurrency: 2 },
);

const analysisWorker = new Worker<AnalysisJobData>(
  "analysis",
  async (job) => processAnalysis(job, db, config),
  { connection: { url: config.redisUrl }, concurrency: 1 },
);

const reportWorker = new Worker<ReportJobData>(
  "report",
  async (job) => processReport(job, db, config),
  { connection: { url: config.redisUrl }, concurrency: 2 },
);

const workers = [ingestionWorker, indexingWorker, analysisWorker, reportWorker];

for (const worker of workers) {
  worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed on queue ${worker.name}`);
  });
  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed on queue ${worker.name}:`, err.message);
  });
}

// Graceful shutdown
async function shutdown() {
  console.log("Shutting down workers...");
  await Promise.all(workers.map((w) => w.close()));
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("ArchLens worker started. Listening for jobs...");
