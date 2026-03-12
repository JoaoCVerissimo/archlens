import type { ModuleAnalysisResult } from "@archlens/shared";

export function buildSynthesisPrompt(
  repoName: string,
  languages: string[],
  totalFiles: number,
  totalLines: number,
  moduleAnalyses: ModuleAnalysisResult[],
  dependencyGraphSummary: string,
): { system: string; user: string } {
  const system = `You are a senior staff engineer writing an architecture review report. You synthesize module-level findings into a comprehensive, actionable review. Always respond with valid JSON matching the requested schema exactly. Do not include markdown fences or any text outside the JSON object.`;

  const moduleSections = moduleAnalyses
    .map(
      (m) => `### Module: ${m.moduleName}
Purpose: ${m.purpose}
Patterns: ${JSON.stringify(m.patternsUsed)}
Anti-patterns: ${JSON.stringify(m.antiPatterns)}
Security: ${JSON.stringify(m.securityConcerns)}
Tech debt: ${JSON.stringify(m.techDebt)}`,
    )
    .join("\n\n");

  const user = `You have analyzed ${moduleAnalyses.length} modules from the ${repoName} repository.

## Repository Overview
- Languages: ${languages.join(", ")}
- Total files: ${totalFiles}
- Total lines: ${totalLines}

## Module Analyses
${moduleSections}

## Dependency Graph Summary
${dependencyGraphSummary}

Synthesize these module-level analyses into a comprehensive architecture review. Respond with JSON:

{
  "architectureSummary": "2-3 paragraph overview of the system architecture",
  "architectureStyle": "string (e.g., monolith, microservices, modular monolith, layered)",
  "identifiedPatterns": [
    {"name": "string", "description": "string", "assessment": "string"}
  ],
  "crossCuttingConcerns": [
    {"concern": "string", "currentApproach": "string", "recommendation": "string"}
  ],
  "potentialProblems": [
    {"title": "string", "description": "string", "severity": "string", "affectedModules": ["string"]}
  ],
  "securityIssues": [
    {"title": "string", "description": "string", "severity": "string", "recommendation": "string"}
  ],
  "scalabilityRisks": [
    {"risk": "string", "currentState": "string", "recommendation": "string"}
  ],
  "suggestedImprovements": [
    {"title": "string", "description": "string", "priority": "high|medium|low", "effort": "small|medium|large", "impact": "string"}
  ],
  "onboardingNotes": "2-3 paragraphs a new engineer would find helpful"
}`;

  return { system, user };
}
