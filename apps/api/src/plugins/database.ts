import fp from "fastify-plugin";
import { createDb, type Database } from "@archlens/db";

declare module "fastify" {
  interface FastifyInstance {
    db: Database;
  }
}

export default fp(async (fastify, opts: { databaseUrl: string }) => {
  const db = createDb(opts.databaseUrl);
  fastify.decorate("db", db);
  fastify.log.info("Database connected");
});
