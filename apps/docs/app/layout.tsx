import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ThemeProvider } from "@/components/site/theme-provider";
import { TopBar } from "@/components/site/top-bar";

export const metadata: Metadata = {
  title: { default: "@kyberry/finix-client-sdk", template: "%s · finix-client-sdk" },
  description: "Typed browser and React bindings for the Finix.js v2 hosted payment form.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <ThemeProvider>
          <TopBar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
