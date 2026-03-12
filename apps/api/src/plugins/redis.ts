import fp from "fastify-plugin";
import { Redis } from "ioredis";

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
    redisUrl: string;
  }
}

export default fp(async (fastify, opts: { redisUrl: string }) => {
  const redis = new Redis(opts.redisUrl, { maxRetriesPerRequest: null });
  fastify.decorate("redis", redis);
  fastify.decorate("redisUrl", opts.redisUrl);

  fastify.addHook("onClose", async () => {
    await redis.quit();
  });

  fastify.log.info("Redis connected");
});
