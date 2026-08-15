"use client";

import { defineFinixHostedAppearance, type FinixClient, type FinixSdkError } from "@kyberry/finix-client-sdk";
import { useFinixAppearance, useFinixClient, type UseFinixAppearanceResult } from "@kyberry/finix-client-sdk/react";
import { useTheme } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";

export const APPLICATION_ID_ENV = "NEXT_PUBLIC_FINIX_APPLICATION_ID";

/** One sandbox client for the page, or null when the application id is not configured. */
export function useSandboxClient(): FinixClient | null {
  const applicationId = process.env.NEXT_PUBLIC_FINIX_APPLICATION_ID;
  const client = useFinixClient({ environment: "sandbox", applicationId: applicationId || "AP_not_configured" });
  return applicationId ? client : null;
}

// Styles are sent into Finix's iframe as plain values, so the site's colors are
// spelled out here. `default` is the light look; `dark` lists only what changes.
const FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const SITE_APPEARANCE = defineFinixHostedAppearance({
  styles: {
    default: {
      form: { default: { backgroundColor: "#ffffff", color: "#171717", fontFamily: FONT, fontSize: "15px" } },
      input: {
        default: { backgroundColor: "#ffffff", border: "1px solid #e5e5e5", borderRadius: 8, color: "#171717", fontFamily: FONT, fontSize: "15px", padding: "12px 14px", boxShadow: "none" },
        focused: { border: "1px solid #2f6fd6", boxShadow: "0 0 0 3px rgba(47, 111, 214, 0.25)" },
        error: { border: "1px solid #dc2626", color: "#171717" },
      },
      sectionHeader: { default: { backgroundColor: "transparent", borderColor: "#e5e5e5", color: "#737373", fontFamily: FONT }, focused: { borderColor: "#2f6fd6", color: "#2f6fd6" } },
      section: { default: { backgroundColor: "transparent", borderColor: "transparent", padding: "0" } },
    },
    dark: {
      form: { default: { backgroundColor: "#0a0a0a", color: "#fafafa" } },
      input: {
        default: { backgroundColor: "#171717", border: "1px solid rgba(255, 255, 255, 0.14)", color: "#fafafa" },
        focused: { border: "1px solid #7fb0f5", boxShadow: "0 0 0 3px rgba(127, 176, 245, 0.3)" },
        error: { border: "1px solid #f87171", color: "#fafafa" },
      },
      sectionHeader: { default: { borderColor: "rgba(255, 255, 255, 0.14)", color: "#a3a3a3" }, focused: { borderColor: "#7fb0f5", color: "#7fb0f5" } },
    },
  },
});

/**
 * The site appearance flattened for the current theme, plus the instanceKey
 * that recreates the hosted form when the theme flips. Null until the theme
 * is known on the client.
 */
export function useSiteAppearance(): UseFinixAppearanceResult | null {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const result = useFinixAppearance(SITE_APPEARANCE, resolvedTheme === "dark" ? "dark" : "light");
  return mounted ? result : null;
}

export function MissingApplicationId() {
  return (
    <p className="text-sm text-muted-foreground">
      Set <code>{APPLICATION_ID_ENV}</code> in <code>apps/docs/.env.local</code> to mount this example against the Finix sandbox.
    </p>
  );
}

export function ExampleFrame({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-border bg-background p-5">{children}</div>;
}

export function Telemetry({
  status,
  hasErrors,
  token,
  error,
}: {
  status: string;
  hasErrors: boolean;
  token: string | null;
  error: FinixSdkError | null;
}) {
  const rows: Array<[string, string]> = [
    ["status", status],
    ["hasErrors", String(hasErrors)],
    ["token", token ?? "none"],
    ["error", error ? `${error.code}: ${error.message}` : "none"],
  ];
  return (
    <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 border-t border-border pt-3 text-xs">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="truncate font-mono text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
