import { TARGET_CHUNK_TOKENS, CHARS_PER_TOKEN } from "@archlens/shared";

export interface CodeChunk {
  moduleName: string;
  files: Array<{ path: string; language: string; lineCount: number; content: string }>;
  estimatedTokens: number;
}

/**
 * Groups files into logical modules (by top-level directory) and splits
 * large modules into sub-chunks that fit within token limits.
 */
export function chunkCodebase(
  files: Array<{ path: string; language: string; lineCount: number; content: string }>,
): CodeChunk[] {
  // Group by top-level directory
  const moduleMap = new Map<string, typeof files>();
  for (const file of files) {
    const parts = file.path.split("/");
    const moduleName = parts.length > 1 ? parts[0] : "(root)";
    if (!moduleMap.has(moduleName)) moduleMap.set(moduleName, []);
    moduleMap.get(moduleName)!.push(file);
  }

  const chunks: CodeChunk[] = [];

  for (const [moduleName, moduleFiles] of moduleMap) {
    const totalTokens = moduleFiles.reduce(
      (sum, f) => sum + Math.ceil(f.content.length / CHARS_PER_TOKEN),
      0,
    );

    if (totalTokens <= TARGET_CHUNK_TOKENS) {
      // Module fits in one chunk
      chunks.push({
        moduleName,
        files: moduleFiles,
        estimatedTokens: totalTokens,
      });
    } else {
      // Split module into sub-chunks
      let currentChunk: typeof moduleFiles = [];
      let currentTokens = 0;
      let subIndex = 1;

      for (const file of moduleFiles) {
        const fileTokens = Math.ceil(file.content.length / CHARS_PER_TOKEN);

        if (currentTokens + fileTokens > TARGET_CHUNK_TOKENS && currentChunk.length > 0) {
          chunks.push({
            moduleName: `${moduleName} (part ${subIndex})`,
            files: currentChunk,
            estimatedTokens: currentTokens,
          });
          subIndex++;
          currentChunk = [];
          currentTokens = 0;
        }

        currentChunk.push(file);
        currentTokens += fileTokens;
      }

      if (currentChunk.length > 0) {
        chunks.push({
          moduleName: subIndex > 1 ? `${moduleName} (part ${subIndex})` : moduleName,
          files: currentChunk,
          estimatedTokens: currentTokens,
        });
      }
    }
  }

  return chunks;
}
