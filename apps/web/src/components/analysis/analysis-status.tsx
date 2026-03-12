"use client";

import type { Analysis } from "@archlens/shared";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { capitalize } from "@/lib/utils";

const statusVariant: Record<string, "info" | "success" | "warning" | "error" | "default"> = {
  queued: "default",
  processing: "info",
  chunking: "info",
  analyzing: "info",
  synthesizing: "info",
  completed: "success",
  failed: "error",
};

export function AnalysisStatus({ analysis }: { analysis: Analysis }) {
  const isRunning = !["completed", "failed"].includes(analysis.status);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {isRunning && <Spinner />}
        <Badge variant={statusVariant[analysis.status]}>
          {capitalize(analysis.status)}
        </Badge>
        <span className="text-sm text-gray-500">
          {capitalize(analysis.analysisType)} analysis
        </span>
      </div>

      {isRunning && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{analysis.progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-500"
              style={{ width: `${analysis.progress}%` }}
            />
          </div>
          {analysis.totalChunks && (
            <p className="text-xs text-gray-500">
              {analysis.completedChunks ?? 0} / {analysis.totalChunks} modules analyzed
            </p>
          )}
        </div>
      )}

      {analysis.status === "failed" && analysis.errorMessage && (
        <p className="text-sm text-red-600">{analysis.errorMessage}</p>
      )}

      {analysis.status === "completed" && analysis.totalTokensUsed && (
        <p className="text-xs text-gray-500">
          Completed using {analysis.totalTokensUsed.toLocaleString()} tokens
        </p>
      )}
    </div>
  );
}
