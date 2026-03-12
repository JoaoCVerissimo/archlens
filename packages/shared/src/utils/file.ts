import { extname } from "node:path";
import { LANGUAGE_EXTENSIONS, BINARY_EXTENSIONS, IGNORED_DIRECTORIES } from "../constants/languages.js";

export function detectLanguage(filePath: string): string | null {
  const ext = extname(filePath).toLowerCase();
  return LANGUAGE_EXTENSIONS[ext] ?? null;
}

export function isBinaryFile(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

export function isIgnoredDirectory(dirName: string): boolean {
  return IGNORED_DIRECTORIES.has(dirName);
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
