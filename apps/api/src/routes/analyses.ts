import type { FastifyInstance } from "fastify";
import { eq, sql, type SQL } from "drizzle-orm";
import { Queue } from "bullmq";
import { analyses, findings, repositories } from "@archlens/db";
import { ANALYSIS_TYPES } from "@archlens/shared";
import { NotFoundError, ValidationError } from "../lib/errors.js";
import { parsePagination, buildPaginationMeta } from "../lib/pagination.js";

export async function analysisRoutes(fastify: FastifyInstance) {
  const analysisQueue = new Queue("analysis", { connection: { url: fastify.redisUrl } });

  // POST /api/v1/repositories/:id/analyses
  fastify.post("/api/v1/repositories/:id/analyses", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { analysisType?: string; model?: string };

    // Verify repo exists and is indexed
    const [repo] = await fastify.db
      .select()
      .from(repositories)
      .where(eq(repositories.id, id))
      .limit(1);
    if (!repo) throw new NotFoundError("Repository", id);
    if (repo.status !== "indexed") {
      throw new ValidationError("Repository must be indexed before analysis can start");
    }

    if (!body.analysisType || !ANALYSIS_TYPES.includes(body.analysisType as any)) {
      throw new ValidationError(`analysisType must be one of: ${ANALYSIS_TYPES.join(", ")}`);
    }

    const [analysis] = await fastify.db
      .insert(analyses)
      .values({
        repositoryId: id,
        analysisType: body.analysisType as any,
        modelUsed: body.model ?? null,
      })
      .returning();

    await analysisQueue.add("analyze", { analysisId: analysis.id }, { jobId: `analyze-${analysis.id}` });

    reply.code(201);
    return { success: true, data: analysis };
  });

  // GET /api/v1/repositories/:id/analyses
  fastify.get("/api/v1/repositories/:id/analyses", async (request) => {
    const { id } = request.params as { id: string };
    const query = request.query as { page?: string; perPage?: string; status?: string; type?: string };
    const pagination = parsePagination({
      page: query.page ? parseInt(query.page) : undefined,
      perPage: query.perPage ? parseInt(query.perPage) : undefined,
    });

    const conditions: SQL[] = [eq(analyses.repositoryId, id)];
    if (query.status) conditions.push(eq(analyses.status, query.status as any));
    if (query.type) conditions.push(eq(analyses.analysisType, query.type as any));

    const where = sql`${sql.join(conditions, sql` AND `)}`;

    const [rows, [{ count }]] = await Promise.all([
      fastify.db.select().from(analyses).where(where).limit(pagination.perPage).offset(pagination.offset),
      fastify.db.select({ count: sql<number>`count(*)::int` }).from(analyses).where(where),
    ]);

    return {
      success: true,
      data: rows,
      meta: buildPaginationMeta(pagination.page, pagination.perPage, count),
    };
  });

  // GET /api/v1/analyses/:id
  fastify.get("/api/v1/analyses/:id", async (request) => {
    const { id } = request.params as { id: string };
    const [analysis] = await fastify.db
      .select()
      .from(analyses)
      .where(eq(analyses.id, id))
      .limit(1);
    if (!analysis) throw new NotFoundError("Analysis", id);
    return { success: true, data: analysis };
  });

  // GET /api/v1/analyses/:id/findings
  fastify.get("/api/v1/analyses/:id/findings", async (request) => {
    const { id } = request.params as { id: string };
    const query = request.query as { page?: string; perPage?: string; category?: string; severity?: string };
    const pagination = parsePagination({
      page: query.page ? parseInt(query.page) : undefined,
      perPage: query.perPage ? parseInt(query.perPage) : undefined,
    });

    const conditions: SQL[] = [eq(findings.analysisId, id)];
    if (query.category) conditions.push(eq(findings.category, query.category as any));
    if (query.severity) conditions.push(eq(findings.severity, query.severity as any));

    const where = sql`${sql.join(conditions, sql` AND `)}`;

    const [rows, [{ count }]] = await Promise.all([
      fastify.db.select().from(findings).where(where).limit(pagination.perPage).offset(pagination.offset),
      fastify.db.select({ count: sql<number>`count(*)::int` }).from(findings).where(where),
    ]);

    return {
      success: true,
      data: rows,
      meta: buildPaginationMeta(pagination.page, pagination.perPage, count),
    };
  });
}
