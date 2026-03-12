import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as repositoriesSchema from "./schema/repositories.js";
import * as filesSchema from "./schema/files.js";
import * as dependenciesSchema from "./schema/dependencies.js";
import * as analysesSchema from "./schema/analyses.js";
import * as findingsSchema from "./schema/findings.js";
import * as reportsSchema from "./schema/reports.js";

export const schema = {
  ...repositoriesSchema,
  ...filesSchema,
  ...dependenciesSchema,
  ...analysesSchema,
  ...findingsSchema,
  ...reportsSchema,
};

export function createDb(connectionString: string) {
  const client = postgres(connectionString);
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDb>;

// Re-export schema tables for convenience
export { repositories } from "./schema/repositories.js";
export { files } from "./schema/files.js";
export { dependencies } from "./schema/dependencies.js";
export { analyses, analysisChunks } from "./schema/analyses.js";
export { findings } from "./schema/findings.js";
export { reports } from "./schema/reports.js";
