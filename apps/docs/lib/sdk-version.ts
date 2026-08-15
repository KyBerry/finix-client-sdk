import { readFileSync } from "node:fs";
import path from "node:path";

export function getSdkVersion(): string {
  const manifestPath = path.resolve(process.cwd(), "..", "..", "packages", "sdk", "package.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { version?: unknown };
  return typeof manifest.version === "string" ? manifest.version : "0.0.0";
}
