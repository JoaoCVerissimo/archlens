import type { PaginationMeta } from "@archlens/shared";

export interface PaginationParams {
  page: number;
  perPage: number;
  offset: number;
}

export function parsePagination(query: { page?: number; perPage?: number }): PaginationParams {
  const page = Math.max(1, query.page ?? 1);
  const perPage = Math.min(100, Math.max(1, query.perPage ?? 20));
  return { page, perPage, offset: (page - 1) * perPage };
}

export function buildPaginationMeta(
  page: number,
  perPage: number,
  total: number,
): PaginationMeta {
  return {
    page,
    perPage,
    total,
    totalPages: Math.ceil(total / perPage),
  };
}
