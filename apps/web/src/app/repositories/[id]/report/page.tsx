"use client";

import { use, useState } from "react";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { useReports } from "@/hooks/use-analysis";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api-client";

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const analysisId = searchParams.get("analysisId") ?? "";
  const { data: reportsData, mutate: refreshReports } = useReports(id);
  const [generating, setGenerating] = useState(false);

  const reports = reportsData ?? [];
  const latestReport = reports[0];

  const generateReport = async (type: string) => {
    setGenerating(true);
    try {
      await api.post(`/analyses/${analysisId}/reports`, { reportType: type });
      refreshReports();
    } catch {
      // handle error
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        {analysisId && (
          <div className="flex gap-2">
            {["full_review", "architecture_overview", "onboarding", "tech_debt"].map((type) => (
              <Button
                key={type}
                variant="secondary"
                size="sm"
                disabled={generating}
                onClick={() => generateReport(type)}
              >
                {type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </Button>
            ))}
          </div>
        )}
      </div>

      {generating && (
        <div className="flex items-center gap-2">
          <Spinner />
          <span className="text-sm text-gray-500">Generating report...</span>
        </div>
      )}

      {reports.map((report) => (
        <Card key={report.id}>
          <CardHeader>
            <h2 className="font-semibold">{report.title}</h2>
            {report.summary && (
              <p className="mt-1 text-sm text-gray-500">{report.summary}</p>
            )}
          </CardHeader>
          <CardBody>
            <div className="prose prose-sm max-w-none">
              {(report.sections as any[]).map((section: any, i: number) => (
                <div key={i}>
                  <h3>{section.heading}</h3>
                  <ReactMarkdown>{section.contentMarkdown}</ReactMarkdown>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      ))}

      {reports.length === 0 && !generating && (
        <p className="text-gray-500">
          No reports generated yet. Click a report type above to generate one.
        </p>
      )}
    </div>
  );
}
