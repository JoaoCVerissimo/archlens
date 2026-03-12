import type { Finding } from "@archlens/shared";
import { Card, CardBody } from "@/components/ui/card";
import { SeverityBadge } from "./severity-badge";
import { capitalize } from "@/lib/utils";

export function FindingCard({ finding }: { finding: Finding }) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <SeverityBadge severity={finding.severity} />
              <span className="text-xs text-gray-500">{capitalize(finding.category)}</span>
            </div>
            <h3 className="font-medium text-gray-900">{finding.title}</h3>
            <p className="text-sm text-gray-600">{finding.description}</p>
            {finding.suggestion && (
              <p className="text-sm text-brand-700">
                <span className="font-medium">Suggestion:</span> {finding.suggestion}
              </p>
            )}
            {finding.filePaths && (finding.filePaths as string[]).length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {(finding.filePaths as string[]).map((path) => (
                  <code
                    key={path}
                    className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700"
                  >
                    {path}
                  </code>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
