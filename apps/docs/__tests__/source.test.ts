import { EXAMPLE_IDS, readExampleSource, highlightCode } from "@/lib/source";

describe("readExampleSource", () => {
  it("returns the source of every launch example", () => {
    for (const id of EXAMPLE_IDS) {
      const source = readExampleSource(id);
      expect(source).toContain('"use client"');
      expect(source).toContain("@kyberry/finix-client-sdk");
    }
  });

  it("throws for an unknown id", () => {
    expect(() => readExampleSource("nope" as never)).toThrow(/Unknown example/);
  });
});

describe("highlightCode", () => {
  it("emits dual-theme shiki markup", async () => {
    const html = await highlightCode("const x = 1;", "ts");
    expect(html).toContain("--shiki-light");
    expect(html).toContain("--shiki-dark");
  });
});
