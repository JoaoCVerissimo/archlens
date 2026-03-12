import Fastify from "fastify";
import cors from "@fastify/cors";
import { loadConfig } from "./config.js";
import databasePlugin from "./plugins/database.js";
import redisPlugin from "./plugins/redis.js";
import authPlugin from "./plugins/auth.js";
import { healthRoutes } from "./routes/health.js";
import { repositoryRoutes } from "./routes/repositories.js";
import { analysisRoutes } from "./routes/analyses.js";
import { reportRoutes } from "./routes/reports.js";
import { graphRoutes } from "./routes/graphs.js";
import { AppError } from "./lib/errors.js";

const config = loadConfig();

const fastify = Fastify({
  logger: {
    level: "info",
    transport: {
      target: "pino-pretty",
      options: { translateTime: "HH:MM:ss Z", ignore: "pid,hostname" },
    },
  },
});

// Error handler
fastify.setErrorHandler(async (error, request, reply) => {
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      success: false,
      error: { code: error.code, message: error.message },
    });
  }

  fastify.log.error(error);
  return reply.code(500).send({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "An internal error occurred" },
  });
});

// Plugins
await fastify.register(cors, { origin: true });
await fastify.register(databasePlugin, { databaseUrl: config.databaseUrl });
await fastify.register(redisPlugin, { redisUrl: config.redisUrl });
await fastify.register(authPlugin, { apiKey: config.apiKey });

// Routes
await fastify.register(healthRoutes);
await fastify.register(repositoryRoutes);
await fastify.register(analysisRoutes);
await fastify.register(reportRoutes);
await fastify.register(graphRoutes);

// Start
try {
  await fastify.listen({ port: config.port, host: config.host });
  fastify.log.info(`ArchLens API listening on http://${config.host}:${config.port}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
