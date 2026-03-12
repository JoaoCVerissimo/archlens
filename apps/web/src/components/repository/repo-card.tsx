import Link from "next/link";
import type { Repository } from "@archlens/shared";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, capitalize } from "@/lib/utils";

const statusVariant: Record<string, "info" | "success" | "warning" | "error" | "default"> = {
  pending: "default",
  cloning: "info",
  cloned: "info",
  indexing: "info",
  indexed: "success",
  failed: "error",
};

export function RepoCard({ repo }: { repo: Repository }) {
  const languages = (repo.languages as any[]) ?? [];

  return (
    <Link href={`/repositories/${repo.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardBody>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{repo.name}</h3>
              <p className="text-sm text-gray-500">{capitalize(repo.sourceType)}</p>
            </div>
            <Badge variant={statusVariant[repo.status]}>{capitalize(repo.status)}</Badge>
          </div>
          {languages.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {languages.slice(0, 5).map((lang: any) => (
                <Badge key={lang.name} variant="info">
                  {lang.name} {lang.percentage}%
                </Badge>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-gray-400">{formatDate(repo.createdAt)}</p>
        </CardBody>
      </Card>
    </Link>
  );
}
