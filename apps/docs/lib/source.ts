import { readFileSync } from "node:fs";
import path from "node:path";

import { codeToHtml } from "shiki";

export const EXAMPLE_IDS = ["basic-card", "themed-appearance", "react-headless", "form-options"] as const;
export type ExampleId = (typeof EXAMPLE_IDS)[number];

const examplesDir = path.resolve(process.cwd(), "components", "examples");

export function readExampleSource(id: ExampleId): string {
  if (!EXAMPLE_IDS.includes(id)) {
    throw new Error(`Unknown example "${id}".`);
  }
  return readFileSync(path.join(examplesDir, `${id}.tsx`), "utf8");
}

export function highlightCode(code: string, lang: string): Promise<string> {
  return codeToHtml(code, {
    lang,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  });
}
