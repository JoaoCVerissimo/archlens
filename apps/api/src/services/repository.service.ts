import { eq, sql, type SQL } from "drizzle-orm";
import { repositories } from "@archlens/db";
import type { Database } from "@archlens/db";
import type { SourceType } from "@archlens/shared";

export class RepositoryService {
  constructor(private db: Database) {}

  async create(data: { name: string; sourceType: SourceType; sourceUrl?: string; branch?: string }) {
    const [repo] = await this.db
      .insert(repositories)
      .values({
        name: data.name,
        sourceType: data.sourceType,
        sourceUrl: data.sourceUrl ?? null,
        branch: data.branch ?? "main",
      })
      .returning();
    return repo;
  }

  async findById(id: string) {
    const [repo] = await this.db
      .select()
      .from(repositories)
      .where(eq(repositories.id, id))
      .limit(1);
    return repo ?? null;
  }

  async list(opts: { status?: string; limit: number; offset: number }) {
    const conditions: SQL[] = [];
    if (opts.status) {
      conditions.push(eq(repositories.status, opts.status as any));
    }

    const where = conditions.length > 0
      ? sql`${sql.join(conditions, sql` AND `)}`
      : undefined;

    const [rows, [{ count }]] = await Promise.all([
      this.db
        .select()
        .from(repositories)
        .where(where)
        .limit(opts.limit)
        .offset(opts.offset)
        .orderBy(repositories.createdAt),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(repositories)
        .where(where),
    ]);

    return { rows, total: count };
  }

  async updateStatus(id: string, status: string, errorMessage?: string) {
    const [repo] = await this.db
      .update(repositories)
      .set({
        status: status as any,
        errorMessage: errorMessage ?? null,
        updatedAt: new Date(),
      })
      .where(eq(repositories.id, id))
      .returning();
    return repo;
  }

  async delete(id: string) {
    const [repo] = await this.db
      .delete(repositories)
      .where(eq(repositories.id, id))
      .returning();
    return repo ?? null;
  }
}
