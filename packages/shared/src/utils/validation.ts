const GITHUB_URL_PATTERN = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\.git)?$/;

export function isValidGitHubUrl(url: string): boolean {
  return GITHUB_URL_PATTERN.test(url);
}

export function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Attempt to parse Claude's JSON response, handling common issues
 * like markdown fences wrapping the JSON.
 */
export function parseClaudeJson<T>(raw: string): T {
  let cleaned = raw.trim();

  // Strip markdown code fences
  if (cleaned.startsWith("```")) {
    const firstNewline = cleaned.indexOf("\n");
    cleaned = cleaned.slice(firstNewline + 1);
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, -3).trim();
    }
  }

  return JSON.parse(cleaned) as T;
}
