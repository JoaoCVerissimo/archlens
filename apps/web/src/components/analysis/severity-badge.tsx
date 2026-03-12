import { Badge } from "@/components/ui/badge";
import type { SeverityLevel } from "@archlens/shared";

const severityVariant: Record<SeverityLevel, "info" | "success" | "warning" | "error" | "default"> = {
  info: "info",
  low: "default",
  medium: "warning",
  high: "error",
  critical: "error",
};

export function SeverityBadge({ severity }: { severity: SeverityLevel }) {
  return <Badge variant={severityVariant[severity]}>{severity.toUpperCase()}</Badge>;
}
