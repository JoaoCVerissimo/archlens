export function buildDependencyReviewPrompt(
  packageManifest: string,
  internalDependencyGraph: string,
  importPatterns: string,
): { system: string; user: string } {
  const system = `You are analyzing the dependency structure of a software project. Always respond with valid JSON matching the requested schema exactly. Do not include markdown fences or any text outside the JSON object.`;

  const user = `Analyze the dependency structure of this project.

## Package manifest:
${packageManifest}

## Internal dependency graph:
${internalDependencyGraph}

## Import patterns observed:
${importPatterns}

Respond with JSON:

{
  "externalDependencies": {
    "totalCount": number,
    "assessment": "minimal|reasonable|heavy|excessive",
    "concerning": [
      {"package": "string", "reason": "string", "alternative": "string"}
    ]
  },
  "internalStructure": {
    "circularDependencies": [["module_a", "module_b"]],
    "couplingAssessment": "loose|moderate|tight",
    "layeringViolations": [{"from": "string", "to": "string", "description": "string"}]
  },
  "moduleBoundaries": [
    {"name": "string", "files": ["string"], "responsibility": "string", "cohesion": "low|medium|high"}
  ]
}`;

  return { system, user };
}
