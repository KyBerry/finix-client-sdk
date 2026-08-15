import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { z } from "zod";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const packageJson = z.object({ name: z.string(), version: z.string() }).parse(
  JSON.parse(readFileSync(resolve(packageRoot, "package.json"), "utf8")),
);
const actualTag = process.argv[2];
const expectedTag = `v${packageJson.version}`;

if (actualTag !== expectedTag) {
  console.error(`Release tag ${JSON.stringify(actualTag)} does not match package version ${JSON.stringify(expectedTag)}.`);
  process.exit(1);
}

console.log(`Release tag ${actualTag} matches ${packageJson.name}@${packageJson.version}.`);
