import type { FileSymbols } from "@archlens/shared";

export interface LanguageParser {
  extractSymbols(content: string, filePath: string): FileSymbols;
}

/**
 * Simple regex-based parser for extracting symbols.
 * Falls back to basic pattern matching when tree-sitter is not available for a language.
 */
export class GenericParser implements LanguageParser {
  extractSymbols(content: string, filePath: string): FileSymbols {
    const classes: string[] = [];
    const functions: string[] = [];
    const exports: string[] = [];
    const imports: Array<{ source: string; specifiers: string[]; isDefault: boolean }> = [];

    const lines = content.split("\n");
    for (const line of lines) {
      // Class declarations
      const classMatch = line.match(/(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/);
      if (classMatch) classes.push(classMatch[1]);

      // Function declarations
      const funcMatch = line.match(
        /(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
      );
      if (funcMatch) functions.push(funcMatch[1]);

      // Arrow functions / const declarations
      const arrowMatch = line.match(
        /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(/,
      );
      if (arrowMatch) functions.push(arrowMatch[1]);

      // Export statements
      const exportMatch = line.match(/export\s+(?:default\s+)?(?:class|function|const|let|var|interface|type|enum)\s+(\w+)/);
      if (exportMatch) exports.push(exportMatch[1]);

      // Import statements
      const importMatch = line.match(
        /import\s+(?:(?:(\w+)\s*,?\s*)?(?:\{([^}]+)\})?\s+from\s+)?['"]([^'"]+)['"]/,
      );
      if (importMatch) {
        const defaultImport = importMatch[1];
        const namedImports = importMatch[2];
        const source = importMatch[3];
        const specifiers: string[] = [];
        if (defaultImport) specifiers.push(defaultImport);
        if (namedImports) {
          specifiers.push(
            ...namedImports.split(",").map((s) => s.trim().split(/\s+as\s+/).pop()!.trim()),
          );
        }
        imports.push({
          source,
          specifiers,
          isDefault: !!defaultImport && !namedImports,
        });
      }
    }

    return { classes, functions, exports, imports };
  }
}

const parsers: Record<string, LanguageParser> = {};
const genericParser = new GenericParser();

export function getParser(language: string): LanguageParser {
  return parsers[language] ?? genericParser;
}
