"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/api-client";
import type { Analysis, Finding, Report } from "@archlens/shared";

export function useAnalyses(repositoryId: string) {
  return useSWR<Analysis[]>(`/repositories/${repositoryId}/analyses`, fetcher);
}

export function useAnalysis(id: string) {
  return useSWR<Analysis>(`/analyses/${id}`, fetcher, {
    refreshInterval: (data) =>
      data && ["completed", "failed"].includes(data.status) ? 0 : 3000,
  });
}

export function useFindings(analysisId: string) {
  return useSWR<Finding[]>(`/analyses/${analysisId}/findings`, fetcher);
}

export function useReports(repositoryId: string) {
  return useSWR<Report[]>(`/repositories/${repositoryId}/reports`, fetcher);
}

export function useReport(id: string) {
  return useSWR<Report>(`/reports/${id}`, fetcher);
}
