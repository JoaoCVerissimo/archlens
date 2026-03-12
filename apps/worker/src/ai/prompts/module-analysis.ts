import type { CodeChunk } from "../chunker.js";

export function buildModuleAnalysisPrompt(
  chunk: CodeChunk,
  repoName: string,
  languages: string[],
  dependencySummary: string,
): { system: string; user: string } {
  const system = `You are a senior staff engineer conducting an architecture review. You provide thorough, actionable feedback. Always respond with valid JSON matching the requested schema exactly. Do not include markdown fences or any text outside the JSON object.`;

  const filesSection = chunk.files
    .map(
      (f) =>
        `--- FILE: ${f.path} (${f.language}, ${f.lineCount} lines) ---\n${f.content}`,
    )
    .join("\n\n");

  const user = `Analyze the following code module.

## Module: ${chunk.moduleName}
## Repository: ${repoName}
## Languages: ${languages.join(", ")}

### Files in this module:
${filesSection}

### Dependencies this module has:
${dependencySummary}

Analyze this module and respond with a JSON object matching this exact schema:

{
  "moduleName": "string",
  "purpose": "1-2 sentence description of what this module does",
  "patternsUsed": [
    {"name": "string", "description": "string", "quality": "good|acceptable|poor"}
  ],
  "antiPatterns": [
    {"name": "string", "location": "file:line", "description": "string", "severity": "low|medium|high|critical", "suggestion": "string"}
  ],
  "complexityAssessment": {
    "overall": "low|medium|high",
    "hotspots": [{"file": "string", "reason": "string"}]
  },
  "securityConcerns": [
    {"issue": "string", "severity": "low|medium|high|critical", "location": "string", "recommendation": "string"}
  ],
  "techDebt": [
    {"description": "string", "effort": "small|medium|large", "impact": "low|medium|high"}
  ],
  "strengths": ["string"],
  "improvementSuggestions": [
    {"description": "string", "priority": "low|medium|high", "effort": "small|medium|large"}
  ]
}

Be specific. Reference actual file names and code constructs. Do not invent issues that do not exist in the code.`;

  return { system, user };
}
