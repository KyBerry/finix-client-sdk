import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const markerPath = resolve(packageRoot, ".package-docs-staged.json");
const allowedFiles = new Set(["README.md", "LICENSE"]);

function isStagedFileList(value: unknown): value is string[] {
  return Array.isArray(value)
    && value.every((fileName: unknown) => typeof fileName === "string" && allowedFiles.has(fileName));
}

if (existsSync(markerPath)) {
  const stagedFiles: unknown = JSON.parse(readFileSync(markerPath, "utf8"));
  if (!isStagedFileList(stagedFiles)) {
    throw new Error("Refusing to clean unexpected staged package files.");
  }

  for (const fileName of stagedFiles) {
    rmSync(resolve(packageRoot, fileName), { force: true });
  }
  rmSync(markerPath, { force: true });
}
