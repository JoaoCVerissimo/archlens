export const DEPENDENCY_TYPES = [
  "import",
  "require",
  "extends",
  "implements",
  "calls",
  "package",
] as const;
export type DependencyType = (typeof DEPENDENCY_TYPES)[number];

export interface Dependency {
  id: string;
  repositoryId: string;
  sourceFileId: string;
  targetFileId: string | null;
  dependencyType: DependencyType;
  targetName: string;
  createdAt: string;
}

export interface DependencyNode {
  id: string;
  label: string;
  filePath: string;
  language: string;
  lineCount: number;
  type: "file" | "module" | "external";
}

export interface DependencyEdge {
  id: string;
  source: string;
  target: string;
  dependencyType: DependencyType;
  label?: string;
}

export interface ModuleNode {
  id: string;
  name: string;
  files: string[];
  fileCount: number;
  totalLines: number;
  languages: string[];
  responsibility?: string;
  cohesion?: "low" | "medium" | "high";
}

export interface ModuleConnection {
  source: string;
  target: string;
  weight: number;
  types: DependencyType[];
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
}

export interface ModuleGraph {
  modules: ModuleNode[];
  connections: ModuleConnection[];
}
