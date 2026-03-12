import { readdir, stat, readFile } from "node:fs/promises";
import { join, basename, extname } from "node:path";
import { createHash } from "node:crypto";
import { isBinaryFile, isIgnoredDirectory, detectLanguage } from "@archlens/shared";

export interface WalkedFile {
  path: string;
  language: string;
  sizeBytes: number;
  lineCount: number;
  hash: string;
  content: string;
}

export async function walkDirectory(rootDir: string): Promise<WalkedFile[]> {
  const files: WalkedFile[] = [];
  await walkRecursive(rootDir, rootDir, files);
  return files;
}

async function walkRecursive(
  currentDir: string,
  rootDir: string,
  results: WalkedFile[],
): Promise<void> {
  const entries = await readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(currentDir, entry.name);

    if (entry.isDirectory()) {
      if (isIgnoredDirectory(entry.name)) continue;
      await walkRecursive(fullPath, rootDir, results);
    } else if (entry.isFile()) {
      if (isBinaryFile(entry.name)) continue;

      const ext = extname(entry.name);
      const language = detectLanguage(entry.name);
      if (!language) continue;

      try {
        const fileStat = await stat(fullPath);
        // Skip files larger than 1MB
        if (fileStat.size > 1_000_000) continue;

        const content = await readFile(fullPath, "utf-8");
        const relativePath = fullPath.slice(rootDir.length + 1);
        const lineCount = content.split("\n").length;
        const hash = createHash("sha256").update(content).digest("hex");

        results.push({
          path: relativePath,
          language,
          sizeBytes: fileStat.size,
          lineCount,
          hash,
          content,
        });
      } catch {
        // Skip files that can't be read
      }
    }
  }
}
