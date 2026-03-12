"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/api-client";
import type { Repository, IndexedFile } from "@archlens/shared";

export function useRepositories() {
  return useSWR<Repository[]>("/repositories", fetcher);
}

export function useRepository(id: string) {
  return useSWR<Repository>(`/repositories/${id}`, fetcher);
}

export function useRepositoryFiles(id: string) {
  return useSWR<IndexedFile[]>(`/repositories/${id}/files`, fetcher);
}
