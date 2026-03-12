export interface WorkerConfig {
  databaseUrl: string;
  redisUrl: string;
  anthropicApiKey: string;
  repoStoragePath: string;
}

export function loadConfig(): WorkerConfig {
  const required = (key: string): string => {
    const value = process.env[key];
    if (!value) throw new Error(`Missing required environment variable: ${key}`);
    return value;
  };

  return {
    databaseUrl: required("DATABASE_URL"),
    redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
    repoStoragePath: process.env.REPO_STORAGE_PATH ?? "/data/repos",
  };
}
