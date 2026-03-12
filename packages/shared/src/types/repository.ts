export const SOURCE_TYPES = ["github", "zip", "local"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const REPOSITORY_STATUSES = [
  "pending",
  "cloning",
  "cloned",
  "indexing",
  "indexed",
  "failed",
] as const;
export type RepositoryStatus = (typeof REPOSITORY_STATUSES)[number];

export interface LanguageBreakdown {
  name: string;
  percentage: number;
  fileCount: number;
}

export interface RepositoryStats {
  totalFiles: number;
  totalLines: number;
  totalSizeBytes: number;
}

export interface Repository {
  id: string;
  name: string;
  sourceType: SourceType;
  sourceUrl: string | null;
  branch: string;
  status: RepositoryStatus;
  languages: LanguageBreakdown[] | null;
  stats: RepositoryStats | null;
  localPath: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IndexedFile {
  id: string;
  repositoryId: string;
  path: string;
  language: string;
  sizeBytes: number;
  lineCount: number;
  hash: string;
  symbols: FileSymbols | null;
  createdAt: string;
}

export interface FileSymbols {
  classes: string[];
  functions: string[];
  exports: string[];
  imports: ImportInfo[];
}

export interface ImportInfo {
  source: string;
  specifiers: string[];
  isDefault: boolean;
}
