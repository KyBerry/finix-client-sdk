import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type { ComponentProps } from "react";

import { LiveExample } from "@/components/live-example";
import { Callout } from "@/components/mdx/callout";
import { H2, H3 } from "@/components/mdx/heading";
import { Pre } from "@/components/mdx/pre";
import { PropsTable } from "@/components/mdx/props-table";
import { Step, Steps } from "@/components/mdx/steps";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function Anchor({ href = "", ...props }: ComponentProps<"a">) {
  if (href.startsWith("/")) {
    return <Link href={href} {...props} />;
  }
  const external = /^https?:/.test(href);
  return <a href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})} {...props} />;
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    a: Anchor,
    h2: H2,
    h3: H3,
    pre: Pre,
    Callout,
    Steps,
    Step,
    PropsTable,
    LiveExample,
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    ...components,
  };
}
