export const REPORT_TYPES = [
  "architecture_overview",
  "full_review",
  "onboarding",
  "tech_debt",
] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export interface ReportSection {
  heading: string;
  contentMarkdown: string;
  order: number;
}

export interface ReportMetadata {
  generatedAt: string;
  model: string;
  tokenCount: number;
}

export interface Report {
  id: string;
  analysisId: string;
  repositoryId: string;
  reportType: ReportType;
  title: string;
  sections: ReportSection[];
  summary: string;
  metadata: ReportMetadata | null;
  createdAt: string;
}
