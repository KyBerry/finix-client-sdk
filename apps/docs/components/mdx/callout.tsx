import { InfoIcon, WarningIcon } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Callout({
  variant = "note",
  title,
  children,
}: {
  variant?: "note" | "warning";
  title?: string;
  children: ReactNode;
}) {
  const Icon = variant === "warning" ? WarningIcon : InfoIcon;
  return (
    <aside
      role="note"
      className={cn(
        "my-5 flex gap-3 border-l-2 py-2 pl-4 pr-3 text-[15px] dark:bg-muted/40 dark:rounded-r-md",
        variant === "warning" ? "border-destructive" : "border-accent-link",
      )}
    >
      <Icon size={16} className="mt-1 shrink-0 text-muted-foreground" aria-hidden />
      <div className="[&>*+*]:mt-2">
        {title ? <p className="font-medium">{title}</p> : null}
        {children}
      </div>
    </aside>
  );
}
