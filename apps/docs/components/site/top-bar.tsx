import { ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { MobileNav } from "@/components/site/mobile-nav";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { getSdkVersion } from "@/lib/sdk-version";

const EXTERNAL_LINKS = [
  { label: "Playground", href: "http://localhost:3000" },
  { label: "GitHub", href: "https://github.com/KyBerry/finix-client-sdk" },
  { label: "npm", href: "https://www.npmjs.com/package/@kyberry/finix-client-sdk" },
];

export function TopBar() {
  const version = getSdkVersion();
  return (
    <header className="sticky top-0 z-40 h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-full max-w-[1400px] items-center gap-3 px-4">
        <MobileNav />
        <Link href="/" className="text-sm font-medium text-foreground">
          @kyberry/finix-client-sdk
        </Link>
        <Badge variant="outline" className="font-mono text-xs font-normal">
          v{version}
        </Badge>
        <nav aria-label="External" className="ml-auto hidden items-center gap-4 sm:flex">
          {EXTERNAL_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
              <ArrowSquareOutIcon size={14} aria-hidden />
            </a>
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
