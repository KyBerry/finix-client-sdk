import type { ComponentType } from "react";

import { BasicCardExample } from "@/components/examples/basic-card";
import { FormOptionsExample } from "@/components/examples/form-options";
import { ReactHeadlessExample } from "@/components/examples/react-headless";
import { ThemedAppearanceExample } from "@/components/examples/themed-appearance";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { highlightCode, readExampleSource, type ExampleId } from "@/lib/source";

const EXAMPLES: Record<ExampleId, ComponentType> = {
  "basic-card": BasicCardExample,
  "themed-appearance": ThemedAppearanceExample,
  "react-headless": ReactHeadlessExample,
  "form-options": FormOptionsExample,
};

export async function LiveExample({ id }: { id: ExampleId }) {
  const Example = EXAMPLES[id];
  const html = await highlightCode(readExampleSource(id), "tsx");
  return (
    <div className="my-6 not-prose">
      <Tabs defaultSelectedKey="preview">
        <TabsList variant="line">
          <TabsTrigger id="preview">Preview</TabsTrigger>
          <TabsTrigger id="code">Code</TabsTrigger>
        </TabsList>
        <TabsContent id="preview" className="pt-3">
          <Example />
        </TabsContent>
        <TabsContent id="code" className="pt-3">
          <div
            className="prose-doc overflow-x-auto rounded-lg border border-border [&_pre]:p-4 [&_pre]:text-[13px] [&_pre]:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
