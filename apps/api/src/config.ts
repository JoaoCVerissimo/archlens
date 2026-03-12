export interface AppConfig {
  port: number;
  host: string;
  databaseUrl: string;
  redisUrl: string;
  apiKey: string;
  anthropicApiKey: string;
}

export function loadConfig(): AppConfig {
  const required = (key: string): string => {
    const value = process.env[key];
    if (!value) throw new Error(`Missing required environment variable: ${key}`);
    return value;
  };

  return {
    port: parseInt(process.env.API_PORT ?? "3001", 10),
    host: process.env.API_HOST ?? "0.0.0.0",
    databaseUrl: required("DATABASE_URL"),
    redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
    apiKey: process.env.API_KEY ?? "archlens-dev-key",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  };
}
