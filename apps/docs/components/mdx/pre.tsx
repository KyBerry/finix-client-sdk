"use client";

import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { useRef, useState, type ComponentProps } from "react";

import { Button } from "@/components/ui/button";

export function Pre({ children, ...props }: ComponentProps<"pre">) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = ref.current?.textContent ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="group relative">
      <pre ref={ref} {...props}>
        {children}
      </pre>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={copied ? "Copied" : "Copy code"}
        onPress={() => void copy()}
        className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      >
        {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
      </Button>
    </div>
  );
}
