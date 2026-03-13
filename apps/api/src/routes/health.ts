import type { FastifyInstance } from "fastify";
import { sql } from "drizzle-orm";

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get("/health", async () => {
    let dbOk = false;
    let redisOk = false;

    try {
      // Test database connectivity
      await fastify.db.execute(sql`SELECT 1`);
      dbOk = true;
    } catch {
      // db unreachable
    }

    try {
      const pong = await fastify.redis.ping();
      redisOk = pong === "PONG";
    } catch {
      // redis unreachable
    }

    const healthy = dbOk && redisOk;
    return {
      success: true,
      data: {
        status: healthy ? "healthy" : "degraded",
        services: {
          database: dbOk ? "connected" : "disconnected",
          redis: redisOk ? "connected" : "disconnected",
        },
        timestamp: new Date().toISOString(),
      },
    };
  });
}
