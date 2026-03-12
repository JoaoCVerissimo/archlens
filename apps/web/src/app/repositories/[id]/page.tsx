"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRepository } from "@/hooks/use-repository";
import { useAnalyses } from "@/hooks/use-analysis";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AnalysisStatus } from "@/components/analysis/analysis-status";
import { api } from "@/lib/api-client";
import { formatDate, capitalize } from "@/lib/utils";

export default function RepositoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: repo, isLoading } = useRepository(id);
  const { data: repoAnalyses, mutate: refreshAnalyses } = useAnalyses(id);
  const [triggerLoading, setTriggerLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!repo) return <p className="text-gray-500">Repository not found.</p>;

  const languages = (repo.languages as any[]) ?? [];
  const stats = repo.stats as any;

  const triggerAnalysis = async (type: string) => {
    setTriggerLoading(true);
    try {
      await api.post(`/repositories/${id}/analyses`, { analysisType: type });
      refreshAnalyses();
    } catch {
      // handle error
    } finally {
      setTriggerLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{repo.name}</h1>
          <p className="text-sm text-gray-500">
            {capitalize(repo.sourceType)} &middot; {repo.branch}
            {repo.sourceUrl && (
              <> &middot; <span className="text-gray-400">{repo.sourceUrl}</span></>
            )}
          </p>
        </div>
        <Badge
          variant={repo.status === "indexed" ? "success" : repo.status === "failed" ? "error" : "info"}
        >
          {capitalize(repo.status)}
        </Badge>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardBody>
              <p className="text-sm text-gray-500">Files</p>
              <p className="text-2xl font-bold">{stats.totalFiles}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-sm text-gray-500">Lines of Code</p>
              <p className="text-2xl font-bold">{stats.totalLines?.toLocaleString()}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-sm text-gray-500">Languages</p>
              <p className="text-2xl font-bold">{languages.length}</p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Languages */}
      {languages.length > 0 && (
        <Card>
          <CardHeader><h2 className="font-semibold">Languages</h2></CardHeader>
          <CardBody>
            <div className="space-y-2">
              {languages.map((lang: any) => (
                <div key={lang.name} className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium">{lang.name}</span>
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${lang.percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{lang.percentage}%</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Actions */}
      {repo.status === "indexed" && (
        <Card>
          <CardHeader><h2 className="font-semibold">Run Analysis</h2></CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-2">
              {["full", "architecture", "code_quality", "security", "dependencies"].map((type) => (
                <Button
                  key={type}
                  variant="secondary"
                  size="sm"
                  disabled={triggerLoading}
                  onClick={() => triggerAnalysis(type)}
                >
                  {capitalize(type)}
                </Button>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Analyses */}
      {repoAnalyses && repoAnalyses.length > 0 && (
        <Card>
          <CardHeader><h2 className="font-semibold">Analyses</h2></CardHeader>
          <CardBody>
            <div className="space-y-4">
              {repoAnalyses.map((analysis) => (
                <div key={analysis.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <AnalysisStatus analysis={analysis} />
                  <div className="mt-2 flex gap-2">
                    {analysis.status === "completed" && (
                      <>
                        <Link href={`/repositories/${id}/analysis?analysisId=${analysis.id}`}>
                          <Button variant="ghost" size="sm">View Findings</Button>
                        </Link>
                        <Link href={`/repositories/${id}/report?analysisId=${analysis.id}`}>
                          <Button variant="ghost" size="sm">Generate Report</Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex gap-2">
        <Link href={`/repositories/${id}/graph`}>
          <Button variant="secondary">Dependency Graph</Button>
        </Link>
      </div>
    </div>
  );
}
