import type { FastifyInstance } from "fastify";
import { eq, sql } from "drizzle-orm";
import { Queue } from "bullmq";
import { analyses, reports, repositories } from "@archlens/db";
import { REPORT_TYPES } from "@archlens/shared";
import { NotFoundError, ValidationError } from "../lib/errors.js";
import { parsePagination, buildPaginationMeta } from "../lib/pagination.js";

export async function reportRoutes(fastify: FastifyInstance) {
  const reportQueue = new Queue("report", { connection: { url: fastify.redisUrl } });

  // POST /api/v1/analyses/:id/reports
  fastify.post("/api/v1/analyses/:id/reports", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { reportType?: string };

    const [analysis] = await fastify.db
      .select()
      .from(analyses)
      .where(eq(analyses.id, id))
      .limit(1);
    if (!analysis) throw new NotFoundError("Analysis", id);
    if (analysis.status !== "completed") {
      throw new ValidationError("Analysis must be completed before generating a report");
    }

    if (!body.reportType || !REPORT_TYPES.includes(body.reportType as any)) {
      throw new ValidationError(`reportType must be one of: ${REPORT_TYPES.join(", ")}`);
    }

    const [report] = await fastify.db
      .insert(reports)
      .values({
        analysisId: id,
        repositoryId: analysis.repositoryId,
        reportType: body.reportType as any,
        title: `${body.reportType} Report`,
        sections: [],
        summary: "",
      })
      .returning();

    await reportQueue.add("generate", { reportId: report.id }, { jobId: `report-${report.id}` });

    reply.code(201);
    return { success: true, data: report };
  });

  // GET /api/v1/reports/:id
  fastify.get("/api/v1/reports/:id", async (request) => {
    const { id } = request.params as { id: string };
    const [report] = await fastify.db
      .select()
      .from(reports)
      .where(eq(reports.id, id))
      .limit(1);
    if (!report) throw new NotFoundError("Report", id);
    return { success: true, data: report };
  });

  // GET /api/v1/repositories/:id/reports
  fastify.get("/api/v1/repositories/:id/reports", async (request) => {
    const { id } = request.params as { id: string };
    const query = request.query as { page?: string; perPage?: string };
    const pagination = parsePagination({
      page: query.page ? parseInt(query.page) : undefined,
      perPage: query.perPage ? parseInt(query.perPage) : undefined,
    });

    const [rows, [{ count }]] = await Promise.all([
      fastify.db
        .select()
        .from(reports)
        .where(eq(reports.repositoryId, id))
        .limit(pagination.perPage)
        .offset(pagination.offset),
      fastify.db
        .select({ count: sql<number>`count(*)::int` })
        .from(reports)
        .where(eq(reports.repositoryId, id)),
    ]);

    return {
      success: true,
      data: rows,
      meta: buildPaginationMeta(pagination.page, pagination.perPage, count),
    };
  });
}
