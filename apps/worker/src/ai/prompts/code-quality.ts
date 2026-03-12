export function buildCodeQualityPrompt(
  moduleName: string,
  primaryLanguage: string,
  fileContents: string,
): { system: string; user: string } {
  const system = `You are reviewing code quality as a senior engineer. Evaluate maintainability, readability, test coverage indicators, and adherence to language idioms. Always respond with valid JSON matching the requested schema exactly. Do not include markdown fences or any text outside the JSON object.`;

  const user = `Review the code quality of this module.

## Module: ${moduleName}
## Language: ${primaryLanguage}

${fileContents}

Respond with JSON:

{
  "qualityScore": 1-10,
  "readability": {"score": 1-10, "notes": "string"},
  "maintainability": {"score": 1-10, "notes": "string"},
  "namingConventions": {"consistent": true|false, "style": "string", "issues": ["string"]},
  "errorHandling": {"approach": "string", "quality": "poor|fair|good|excellent", "gaps": ["string"]},
  "testingIndicators": {"testFilesPresent": true|false, "estimatedCoverage": "none|low|medium|high", "notes": "string"},
  "codeSmells": [
    {"type": "string", "location": "string", "description": "string"}
  ],
  "duplicationConcerns": [
    {"description": "string", "locations": ["string"]}
  ]
}`;

  return { system, user };
}
