"use client";

import { FinixForm } from "@kyberry/finix-client-sdk/react";
import { useState } from "react";

import { ExampleFrame, MissingApplicationId, Telemetry, useSandboxClient, useSiteAppearance } from "./example-shell";

export function ReactHeadlessExample() {
  const client = useSandboxClient();
  const site = useSiteAppearance();
  const [token, setToken] = useState<string | null>(null);

  if (!client) {
    return <MissingApplicationId />;
  }
  if (!site) {
    return null;
  }

  return (
    <FinixForm.Root
      client={client}
      options={{ paymentMethods: ["card"], showAddress: true, ...site.appearance }}
      instanceKey={site.instanceKey}
    >
      <ExampleFrame>
        {/* Host is the only element Finix touches. Everything else is yours. */}
        <FinixForm.Host aria-label="Secure payment fields" />
        <FinixForm.Consumer>
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
                {form.isSubmitting ? "Saving…" : "Save payment method"}
              </button>
              <Telemetry
                status={form.status}
                hasErrors={form.hasErrors}
                token={token}
                error={form.submissionError ?? form.error}
              />
            </>
          )}
        </FinixForm.Consumer>
      </ExampleFrame>
    </FinixForm.Root>
  );
}
