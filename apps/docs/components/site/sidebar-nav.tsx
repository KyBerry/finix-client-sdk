"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAVIGATION } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Documentation" className="flex flex-col gap-6">
      {NAVIGATION.map((section) => (
        <div key={section.title}>
          <p className="mb-2 px-3 text-sm font-medium text-foreground">{section.title}</p>
          <ul className="flex flex-col">
            {section.items.map((item) => {
              const current = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "block border-l-2 py-1.5 pl-[calc(0.75rem-2px)] pr-3 text-sm text-muted-foreground transition-colors hover:text-foreground",
                      current ? "border-accent-link font-medium text-foreground" : "border-transparent",
                    )}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
