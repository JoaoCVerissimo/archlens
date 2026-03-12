import type { FastifyInstance } from "fastify";
import { eq, sql } from "drizzle-orm";
import { files, dependencies, repositories } from "@archlens/db";
import { NotFoundError } from "../lib/errors.js";
import type { DependencyNode, DependencyEdge, ModuleNode, ModuleConnection } from "@archlens/shared";

export async function graphRoutes(fastify: FastifyInstance) {
  // GET /api/v1/repositories/:id/graph
  fastify.get("/api/v1/repositories/:id/graph", async (request) => {
    const { id } = request.params as { id: string };

    const [repo] = await fastify.db
      .select()
      .from(repositories)
      .where(eq(repositories.id, id))
      .limit(1);
    if (!repo) throw new NotFoundError("Repository", id);

    const allFiles = await fastify.db
      .select()
      .from(files)
      .where(eq(files.repositoryId, id));

    const allDeps = await fastify.db
      .select()
      .from(dependencies)
      .where(eq(dependencies.repositoryId, id));

    const nodes: DependencyNode[] = allFiles.map((f) => ({
      id: f.id,
      label: f.path.split("/").pop() ?? f.path,
      filePath: f.path,
      language: f.language,
      lineCount: f.lineCount,
      type: "file" as const,
    }));

    const edges: DependencyEdge[] = allDeps
      .filter((d) => d.targetFileId)
      .map((d) => ({
        id: d.id,
        source: d.sourceFileId,
        target: d.targetFileId!,
        dependencyType: d.dependencyType,
      }));

    return { success: true, data: { nodes, edges } };
  });

  // GET /api/v1/repositories/:id/graph/modules
  fastify.get("/api/v1/repositories/:id/graph/modules", async (request) => {
    const { id } = request.params as { id: string };

    const [repo] = await fastify.db
      .select()
      .from(repositories)
      .where(eq(repositories.id, id))
      .limit(1);
    if (!repo) throw new NotFoundError("Repository", id);

    const allFiles = await fastify.db
      .select()
      .from(files)
      .where(eq(files.repositoryId, id));

    const allDeps = await fastify.db
      .select()
      .from(dependencies)
      .where(eq(dependencies.repositoryId, id));

    // Group files into modules by top-level directory
    const moduleMap = new Map<string, typeof allFiles>();
    for (const file of allFiles) {
      const parts = file.path.split("/");
      const moduleName = parts.length > 1 ? parts[0] : "(root)";
      if (!moduleMap.has(moduleName)) moduleMap.set(moduleName, []);
      moduleMap.get(moduleName)!.push(file);
    }

    // Build file-to-module lookup
    const fileToModule = new Map<string, string>();
    for (const [moduleName, moduleFiles] of moduleMap) {
      for (const f of moduleFiles) {
        fileToModule.set(f.id, moduleName);
      }
    }

    const modules: ModuleNode[] = [...moduleMap.entries()].map(([name, moduleFiles]) => ({
      id: name,
      name,
      files: moduleFiles.map((f) => f.path),
      fileCount: moduleFiles.length,
      totalLines: moduleFiles.reduce((sum, f) => sum + f.lineCount, 0),
      languages: [...new Set(moduleFiles.map((f) => f.language))],
    }));

    // Build module-level connections
    const connectionMap = new Map<string, { weight: number; types: Set<string> }>();
    for (const dep of allDeps) {
      if (!dep.targetFileId) continue;
      const sourceModule = fileToModule.get(dep.sourceFileId);
      const targetModule = fileToModule.get(dep.targetFileId);
      if (!sourceModule || !targetModule || sourceModule === targetModule) continue;

      const key = `${sourceModule}->${targetModule}`;
      if (!connectionMap.has(key)) {
        connectionMap.set(key, { weight: 0, types: new Set() });
      }
      const conn = connectionMap.get(key)!;
      conn.weight++;
      conn.types.add(dep.dependencyType);
    }

    const connections: ModuleConnection[] = [...connectionMap.entries()].map(([key, val]) => {
      const [source, target] = key.split("->");
      return {
        source,
        target,
        weight: val.weight,
        types: [...val.types] as any[],
      };
    });

    return { success: true, data: { modules, connections } };
  });
}
