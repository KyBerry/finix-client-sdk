"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

export function Toc() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLHeadingElement>("article h2[id], article h3[id]"));
    setHeadings(
      nodes.map((node) => ({ id: node.id, text: node.textContent ?? "", level: node.tagName === "H2" ? 2 : 3 })),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0]!.target.id);
        }
      },
      { rootMargin: "-64px 0px -70% 0px", threshold: [0, 1] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav aria-label="On this page" className="text-[13px]">
      <p className="mb-2 font-medium text-foreground">On this page</p>
      <ul className="flex flex-col gap-1.5 border-l border-border">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={cn(
                "-ml-px block border-l py-0.5 text-muted-foreground transition-colors hover:text-foreground",
                heading.level === 3 ? "pl-6" : "pl-3",
                activeId === heading.id ? "border-accent-link text-foreground" : "border-transparent",
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
