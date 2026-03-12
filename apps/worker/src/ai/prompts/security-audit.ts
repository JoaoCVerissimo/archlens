export function buildSecurityAuditPrompt(
  fileContents: string,
  techStack: string,
): { system: string; user: string } {
  const system = `You are a security engineer reviewing code for vulnerabilities. Focus exclusively on security. Always respond with valid JSON matching the requested schema exactly. Do not include markdown fences or any text outside the JSON object.`;

  const user = `Review the following code for security vulnerabilities. Classify using CWE where applicable.

## Technology stack: ${techStack}

## Code to review:
${fileContents}

Respond with JSON:

{
  "vulnerabilities": [
    {
      "cweId": "string or null",
      "title": "string",
      "severity": "info|low|medium|high|critical",
      "location": "file:line",
      "description": "string",
      "exploitScenario": "string",
      "recommendation": "string",
      "codeFixHint": "string"
    }
  ],
  "securityPosture": "poor|fair|good|strong",
  "missingSecurityControls": ["string"]
}`;

  return { system, user };
}
