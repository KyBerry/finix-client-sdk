import { copyFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const repositoryRoot = resolve(packageRoot, "../..");
const markerPath = resolve(packageRoot, ".package-docs-staged.json");
const stagedFiles: string[] = [];

for (const fileName of ["README.md", "LICENSE"] as const) {
  const destination = resolve(packageRoot, fileName);
  if (existsSync(destination)) {
    continue;
  }

  const source = resolve(repositoryRoot, fileName);
  if (!existsSync(source)) {
    throw new Error(`Cannot package ${fileName}: ${source} does not exist.`);
  }

  copyFileSync(source, destination);
  stagedFiles.push(fileName);
}

writeFileSync(markerPath, `${JSON.stringify(stagedFiles)}\n`, "utf8");
