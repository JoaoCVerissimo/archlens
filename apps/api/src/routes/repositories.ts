import type { FastifyInstance } from "fastify";
import { Queue } from "bullmq";
import { RepositoryService } from "../services/repository.service.js";
import { parsePagination, buildPaginationMeta } from "../lib/pagination.js";
import { NotFoundError, ValidationError } from "../lib/errors.js";
import { SOURCE_TYPES, isValidGitHubUrl } from "@archlens/shared";

export async function repositoryRoutes(fastify: FastifyInstance) {
  const service = new RepositoryService(fastify.db);
  const ingestionQueue = new Queue("ingestion", { connection: { url: fastify.redisUrl } });

  // POST /api/v1/repositories
  fastify.post("/api/v1/repositories", async (request, reply) => {
    const body = request.body as {
      name?: string;
      sourceType?: string;
      sourceUrl?: string;
      branch?: string;
    };

    if (!body.name?.trim()) throw new ValidationError("name is required");
    if (!body.sourceType || !SOURCE_TYPES.includes(body.sourceType as any)) {
      throw new ValidationError(`sourceType must be one of: ${SOURCE_TYPES.join(", ")}`);
    }
    if (body.sourceType === "github") {
      if (!body.sourceUrl) throw new ValidationError("sourceUrl is required for github source");
      if (!isValidGitHubUrl(body.sourceUrl)) throw new ValidationError("Invalid GitHub URL");
    }

    const repo = await service.create({
      name: body.name.trim(),
      sourceType: body.sourceType as any,
      sourceUrl: body.sourceUrl,
      branch: body.branch,
    });

    // Enqueue ingestion job
    await ingestionQueue.add("ingest", { repositoryId: repo.id }, { jobId: `ingest-${repo.id}` });

    reply.code(201);
    return { success: true, data: repo };
  });

  // GET /api/v1/repositories
  fastify.get("/api/v1/repositories", async (request) => {
    const query = request.query as { page?: string; perPage?: string; status?: string };
    const pagination = parsePagination({
      page: query.page ? parseInt(query.page) : undefined,
      perPage: query.perPage ? parseInt(query.perPage) : undefined,
    });

    const { rows, total } = await service.list({
      status: query.status,
      limit: pagination.perPage,
      offset: pagination.offset,
    });

    return {
      success: true,
      data: rows,
      meta: buildPaginationMeta(pagination.page, pagination.perPage, total),
    };
  });

  // GET /api/v1/repositories/:id
  fastify.get("/api/v1/repositories/:id", async (request) => {
    const { id } = request.params as { id: string };
    const repo = await service.findById(id);
    if (!repo) throw new NotFoundError("Repository", id);
    return { success: true, data: repo };
  });

  // DELETE /api/v1/repositories/:id
  fastify.delete("/api/v1/repositories/:id", async (request) => {
    const { id } = request.params as { id: string };
    const repo = await service.delete(id);
    if (!repo) throw new NotFoundError("Repository", id);
    return { success: true, data: { deleted: true } };
  });

  // POST /api/v1/repositories/:id/reindex
  fastify.post("/api/v1/repositories/:id/reindex", async (request) => {
    const { id } = request.params as { id: string };
    const repo = await service.findById(id);
    if (!repo) throw new NotFoundError("Repository", id);

    await service.updateStatus(id, "pending");
    await ingestionQueue.add("ingest", { repositoryId: id }, { jobId: `ingest-${id}-${Date.now()}` });

    return { success: true, data: { status: "queued" } };
  });
}
