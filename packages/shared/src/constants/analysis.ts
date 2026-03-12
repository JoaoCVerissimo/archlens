/** Max tokens per chunk sent to Claude (content only, excludes prompt/response overhead) */
export const MAX_CHUNK_TOKENS = 80_000;

/** Target tokens per chunk — leaves room within MAX for prompt template + response */
export const TARGET_CHUNK_TOKENS = 60_000;

/** Rough estimate: 1 token ≈ 4 characters */
export const CHARS_PER_TOKEN = 4;

/** Max concurrent Claude API calls */
export const MAX_CONCURRENT_ANALYSIS = 3;

/** Max retries per chunk on failure */
export const MAX_CHUNK_RETRIES = 3;

/** If more than this fraction of chunks fail, mark the entire analysis as failed */
export const FAILURE_THRESHOLD = 0.5;

/** Default Claude model to use */
export const DEFAULT_MODEL = "claude-sonnet-4-20250514";
