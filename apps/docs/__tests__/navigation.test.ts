import { existsSync } from "node:fs";
import path from "node:path";

import { NAVIGATION, findNavNeighbors, flattenNavigation } from "@/lib/navigation";

const appDir = path.resolve(__dirname, "..", "app");

describe("navigation", () => {
  it("points every item at an existing page.mdx", () => {
    const missing = flattenNavigation()
      .filter((item) => !existsSync(path.join(appDir, item.href, "page.mdx")))
      .map((item) => item.href);
    expect(missing).toEqual([]);
  });

  it("uses unique hrefs that all start with /docs/", () => {
    const hrefs = flattenNavigation().map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs.every((href) => href.startsWith("/docs/"))).toBe(true);
  });

  it("has the four launch sections in order", () => {
    expect(NAVIGATION.map((section) => section.title)).toEqual([
      "Getting started",
      "Guides",
      "Reference",
      "Examples",
    ]);
  });

  it("finds previous and next neighbors across section boundaries", () => {
    const first = flattenNavigation()[0]!;
    const last = flattenNavigation().at(-1)!;
    expect(findNavNeighbors(first.href).previous).toBeUndefined();
    expect(findNavNeighbors(last.href).next).toBeUndefined();
    const { previous, next } = findNavNeighbors("/docs/guides/appearance");
    expect(previous?.href).toBe("/docs/getting-started/tokenization-flow");
    expect(next?.href).toBe("/docs/guides/react");
  });
});
