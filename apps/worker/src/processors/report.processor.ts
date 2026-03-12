import { eq } from "drizzle-orm";
import type { Job } from "bullmq";
import { reports, findings, analyses, repositories } from "@archlens/db";
import type { Database } from "@archlens/db";
import type { Finding, ReportSection, LanguageBreakdown } from "@archlens/shared";
import { ClaudeClient } from "../ai/client.js";
import type { WorkerConfig } from "../config.js";

export interface ReportJobData {
  reportId: string;
}

export async function processReport(
  job: Job<ReportJobData>,
  db: Database,
  config: WorkerConfig,
): Promise<void> {
  const { reportId } = job.data;

  const [report] = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
  if (!report) throw new Error(`Report ${reportId} not found`);

  const [analysis] = await db.select().from(analyses).where(eq(analyses.id, report.analysisId)).limit(1);
  if (!analysis) throw new Error(`Analysis ${report.analysisId} not found`);

  const [repo] = await db.select().from(repositories).where(eq(repositories.id, report.repositoryId)).limit(1);
  if (!repo) throw new Error(`Repository ${report.repositoryId} not found`);

  // Get all findings for this analysis
  const allFindings = await db.select().from(findings).where(eq(findings.analysisId, report.analysisId));

  // Build report sections based on report type
  const sections: ReportSection[] = [];
  let order = 0;

  // Executive Summary
  const languages = ((repo.languages as LanguageBreakdown[] | null) ?? []).map((l) => `${l.name} (${l.percentage}%)`);
  sections.push({
    heading: "Executive Summary",
    contentMarkdown: buildExecutiveSummary(repo.name, languages, allFindings as any[]),
    order: order++,
  });

  // Architecture Patterns
  const patterns = allFindings.filter((f) => f.category === "pattern");
  if (patterns.length > 0) {
    sections.push({
      heading: "Architecture Patterns",
      contentMarkdown: patterns.map((f) => `### ${f.title}\n\n${f.description}`).join("\n\n"),
      order: order++,
    });
  }

  // Issues & Anti-patterns
  const issues = allFindings.filter((f) => f.category === "anti_pattern");
  if (issues.length > 0) {
    sections.push({
      heading: "Issues & Anti-patterns",
      contentMarkdown: issues
        .map((f) => `### ${f.title}\n\n**Severity:** ${f.severity}\n\n${f.description}${f.suggestion ? `\n\n**Suggestion:** ${f.suggestion}` : ""}`)
        .join("\n\n"),
      order: order++,
    });
  }

  // Security
  const security = allFindings.filter((f) => f.category === "security");
  if (security.length > 0) {
    sections.push({
      heading: "Security Findings",
      contentMarkdown: security
        .map((f) => `### ${f.title}\n\n**Severity:** ${f.severity}\n\n${f.description}${f.suggestion ? `\n\n**Recommendation:** ${f.suggestion}` : ""}`)
        .join("\n\n"),
      order: order++,
    });
  }

  // Scalability
  const scalability = allFindings.filter((f) => f.category === "scalability");
  if (scalability.length > 0) {
    sections.push({
      heading: "Scalability Risks",
      contentMarkdown: scalability
        .map((f) => `### ${f.title}\n\n${f.description}${f.suggestion ? `\n\n**Recommendation:** ${f.suggestion}` : ""}`)
        .join("\n\n"),
      order: order++,
    });
  }

  // Suggestions
  const suggestions = allFindings.filter((f) => f.category === "suggestion");
  if (suggestions.length > 0) {
    sections.push({
      heading: "Improvement Suggestions",
      contentMarkdown: suggestions
        .map((f) => {
          const meta = f.metadata as any;
          return `### ${f.title}\n\n${f.description}${meta?.priority ? `\n\n**Priority:** ${meta.priority} | **Effort:** ${meta.effort}` : ""}`;
        })
        .join("\n\n"),
      order: order++,
    });
  }

  // Tech Debt
  const techDebt = allFindings.filter((f) => f.category === "tech_debt");
  if (techDebt.length > 0) {
    sections.push({
      heading: "Technical Debt",
      contentMarkdown: techDebt.map((f) => `### ${f.title}\n\n${f.description}`).join("\n\n"),
      order: order++,
    });
  }

  const summary = `Architecture review of ${repo.name} — ${allFindings.length} findings across ${sections.length - 1} categories.`;

  await db
    .update(reports)
    .set({
      title: `${report.reportType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} — ${repo.name}`,
      sections,
      summary,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: analysis.modelUsed ?? "n/a",
        tokenCount: analysis.totalTokensUsed ?? 0,
      },
    })
    .where(eq(reports.id, reportId));

  job.log(`Report ${reportId} generated with ${sections.length} sections`);
}

function buildExecutiveSummary(repoName: string, languages: string[], allFindings: any[]): string {
  const critical = allFindings.filter((f) => f.severity === "critical").length;
  const high = allFindings.filter((f) => f.severity === "high").length;
  const medium = allFindings.filter((f) => f.severity === "medium").length;

  return `# ${repoName} — Architecture Review

**Languages:** ${languages.join(", ")}
**Total Findings:** ${allFindings.length}
**Critical:** ${critical} | **High:** ${high} | **Medium:** ${medium}

${critical + high > 0 ? "This repository has findings that require immediate attention. See the sections below for details." : "No critical or high-severity issues were found. Review the suggestions below for potential improvements."}`;
}
