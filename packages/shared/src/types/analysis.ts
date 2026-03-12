export const ANALYSIS_TYPES = [
  "architecture",
  "code_quality",
  "security",
  "dependencies",
  "full",
] as const;
export type AnalysisType = (typeof ANALYSIS_TYPES)[number];

export const ANALYSIS_STATUSES = [
  "queued",
  "processing",
  "chunking",
  "analyzing",
  "synthesizing",
  "completed",
  "failed",
] as const;
export type AnalysisStatus = (typeof ANALYSIS_STATUSES)[number];

export const FINDING_CATEGORIES = [
  "pattern",
  "anti_pattern",
  "security",
  "scalability",
  "complexity",
  "tech_debt",
  "suggestion",
] as const;
export type FindingCategory = (typeof FINDING_CATEGORIES)[number];

export const SEVERITY_LEVELS = [
  "info",
  "low",
  "medium",
  "high",
  "critical",
] as const;
export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];

export const CHUNK_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
] as const;
export type ChunkStatus = (typeof CHUNK_STATUSES)[number];

export interface Analysis {
  id: string;
  repositoryId: string;
  analysisType: AnalysisType;
  status: AnalysisStatus;
  progress: number;
  totalChunks: number | null;
  completedChunks: number | null;
  modelUsed: string | null;
  totalTokensUsed: number | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface AnalysisChunk {
  id: string;
  analysisId: string;
  chunkIndex: number;
  moduleName: string;
  filePaths: string[];
  promptTokens: number | null;
  completionTokens: number | null;
  rawResponse: unknown;
  parsedResult: ModuleAnalysisResult | null;
  status: ChunkStatus;
  createdAt: string;
}

export interface Finding {
  id: string;
  analysisId: string;
  category: FindingCategory;
  severity: SeverityLevel;
  title: string;
  description: string;
  filePaths: string[];
  codeSnippet: string | null;
  suggestion: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// Structured output from Claude for a single module
export interface ModuleAnalysisResult {
  moduleName: string;
  purpose: string;
  patternsUsed: PatternInfo[];
  antiPatterns: AntiPatternInfo[];
  complexityAssessment: ComplexityAssessment;
  securityConcerns: SecurityConcern[];
  techDebt: TechDebtItem[];
  strengths: string[];
  improvementSuggestions: ImprovementSuggestion[];
}

export interface PatternInfo {
  name: string;
  description: string;
  quality: "good" | "acceptable" | "poor";
}

export interface AntiPatternInfo {
  name: string;
  location: string;
  description: string;
  severity: SeverityLevel;
  suggestion: string;
}

export interface ComplexityAssessment {
  overall: "low" | "medium" | "high";
  hotspots: Array<{ file: string; reason: string }>;
}

export interface SecurityConcern {
  issue: string;
  severity: SeverityLevel;
  location: string;
  recommendation: string;
}

export interface TechDebtItem {
  description: string;
  effort: "small" | "medium" | "large";
  impact: "low" | "medium" | "high";
}

export interface ImprovementSuggestion {
  description: string;
  priority: "low" | "medium" | "high";
  effort: "small" | "medium" | "large";
}

// Structured output from Claude for the synthesis step
export interface ArchitectureSynthesis {
  architectureSummary: string;
  architectureStyle: string;
  identifiedPatterns: Array<{
    name: string;
    description: string;
    assessment: string;
  }>;
  crossCuttingConcerns: Array<{
    concern: string;
    currentApproach: string;
    recommendation: string;
  }>;
  potentialProblems: Array<{
    title: string;
    description: string;
    severity: string;
    affectedModules: string[];
  }>;
  securityIssues: Array<{
    title: string;
    description: string;
    severity: string;
    recommendation: string;
  }>;
  scalabilityRisks: Array<{
    risk: string;
    currentState: string;
    recommendation: string;
  }>;
  suggestedImprovements: Array<{
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    effort: "small" | "medium" | "large";
    impact: string;
  }>;
  onboardingNotes: string;
}
