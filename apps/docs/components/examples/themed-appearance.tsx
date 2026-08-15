"use client";

import { defineFinixHostedAppearance, defineFinixStyles, mergeFinixStyles } from "@kyberry/finix-client-sdk";
import { FinixPaymentForm, useFinixAppearance } from "@kyberry/finix-client-sdk/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { ExampleFrame, MissingApplicationId, Telemetry, useSandboxClient } from "./example-shell";

// Styles are sent into Finix's iframe as plain values; CSS variables from this
// page cannot reach the hosted fields. One appearance object holds both looks:
// `default` is light, `dark` lists only what changes.
const FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// A bare { input, form } object is treated as the default mode.
const shape = defineFinixStyles({
  form: { default: { fontFamily: FONT, fontSize: "15px" } },
  input: { default: { borderRadius: 12, padding: "14px 16px", fontSize: "15px", fontFamily: FONT, boxShadow: "none" } },
});

const brand = defineFinixHostedAppearance({
  labels: { card_holder_name: "Name on card" },
  styles: mergeFinixStyles(shape, {
    default: {
      form: { default: { backgroundColor: "#ffffff", color: "#171717" } },
      input: {
        default: { backgroundColor: "#f5f5f5", border: "1px solid transparent", color: "#171717" },
        focused: { backgroundColor: "#ffffff", border: "1px solid #2f6fd6", boxShadow: "0 0 0 3px rgba(47, 111, 214, 0.2)" },
        error: { border: "1px solid #dc2626" },
      },
    },
    dark: {
      form: { default: { backgroundColor: "#0a0a0a", color: "#fafafa" } },
      input: {
        default: { backgroundColor: "#1c1c1c", color: "#fafafa" },
        focused: { backgroundColor: "#141414", border: "1px solid #7fb0f5", boxShadow: "0 0 0 3px rgba(127, 176, 245, 0.25)" },
        error: { border: "1px solid #f87171" },
      },
    },
  }),
});

export function ThemedAppearanceExample() {
  const client = useSandboxClient();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [token, setToken] = useState<string | null>(null);

  // Flattens `brand` for the scheme the site is showing and gives an
  // instanceKey that changes with it, so the hosted form is recreated.
  const { appearance, instanceKey } = useFinixAppearance(brand, resolvedTheme === "dark" ? "dark" : "light");

  if (!client) {
    return <MissingApplicationId />;
  }
  if (!mounted) {
    return null;
  }

  return (
    <ExampleFrame>
      <FinixPaymentForm
        client={client}
        options={{ paymentMethods: ["card"], ...appearance }}
        instanceKey={instanceKey}
        aria-label="Secure payment fields"
      >
        {(form) => (
          <>
            <button
              type="button"
              disabled={!form.canSubmit}
              onClick={() => {
                void form
                  .submit()
                  .then((result) => setToken(result.token))
                  .catch(() => {
                    // form.submissionError already holds the failure.
                  });
              }}
              className="mt-4 h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {form.isSubmitting ? "Creating…" : "Create payment token"}
            </button>
            <Telemetry
              status={form.status}
              hasErrors={form.hasErrors}
              token={token}
              error={form.submissionError ?? form.error}
            />
          </>
        )}
      </FinixPaymentForm>
    </ExampleFrame>
  );
}
