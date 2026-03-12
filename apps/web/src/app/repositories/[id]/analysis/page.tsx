"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { useAnalysis, useFindings } from "@/hooks/use-analysis";
import { AnalysisStatus } from "@/components/analysis/analysis-status";
import { FindingCard } from "@/components/analysis/finding-card";
import { Spinner } from "@/components/ui/spinner";

export default function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const analysisId = searchParams.get("analysisId") ?? "";

  const { data: analysis, isLoading } = useAnalysis(analysisId);
  const { data: findingsData } = useFindings(analysisId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!analysis) return <p className="text-gray-500">Analysis not found.</p>;

  const findings = findingsData ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Analysis Results</h1>

      <AnalysisStatus analysis={analysis} />

      {findings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Findings ({findings.length})
          </h2>
          {findings.map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))}
        </div>
      )}
    </div>
  );
}
