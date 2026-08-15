import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const declarationRoot = resolve(packageRoot, "dist");
const relativeSpecifierPattern = /(from\s+["']|import\(["'])(\.\.?\/[^"']+)(["'])/g;

function declarationFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      return declarationFiles(path);
    }
    return entry.name.endsWith(".d.ts") ? [path] : [];
  });
}

for (const declarationPath of declarationFiles(declarationRoot)) {
  const declaration = readFileSync(declarationPath, "utf8");
  const rewritten = declaration.replace(relativeSpecifierPattern, (match, prefix, specifier, suffix) => {
    if (extname(specifier)) {
      return match;
    }
    return `${prefix}${specifier}.js${suffix}`;
  });
  writeFileSync(declarationPath, rewritten, "utf8");
}
