import type { ReactNode } from "react";

export function Steps({ children }: { children: ReactNode }) {
  return <ol className="my-6 flex list-none flex-col gap-6 pl-0 [counter-reset:step]">{children}</ol>;
}

export function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 [counter-increment:step]">
      <span
        aria-hidden
        className="mt-0.5 flex size-7 items-center justify-center rounded-full border border-border text-sm text-muted-foreground before:content-[counter(step)]"
      />
      <div className="min-w-0 [&>*+*]:mt-3">
        <p className="font-medium">{title}</p>
        {children}
      </div>
    </li>
  );
}
