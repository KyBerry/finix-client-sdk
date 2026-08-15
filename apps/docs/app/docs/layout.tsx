import type { ReactNode } from "react";

import { SidebarNav } from "@/components/site/sidebar-nav";
import { Toc } from "@/components/site/toc";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-[1400px] grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_200px]">
      <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] overflow-y-auto border-r border-border py-6 pr-2 lg:block">
        <SidebarNav />
      </aside>
      <main className="min-w-0 px-4 py-8 sm:px-8 lg:px-12">
        <article className="prose-doc mx-auto max-w-[68ch]">{children}</article>
      </main>
      <div className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] overflow-y-auto py-8 pr-4 xl:block">
        <Toc />
      </div>
    </div>
  );
}
