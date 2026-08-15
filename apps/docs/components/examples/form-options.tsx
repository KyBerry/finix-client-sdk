"use client";

import type { FinixPaymentMethods } from "@kyberry/finix-client-sdk";
import { FinixPaymentForm } from "@kyberry/finix-client-sdk/react";
import { useState } from "react";

import { ExampleFrame, MissingApplicationId, Telemetry, useSandboxClient, useSiteAppearance } from "./example-shell";

const METHOD_CHOICES: Array<{ label: string; value: FinixPaymentMethods }> = [
  { label: "Card", value: ["card"] },
  { label: "Bank", value: ["bank"] },
  { label: "Card + bank", value: ["card", "bank"] },
];

export function FormOptionsExample() {
  const client = useSandboxClient();
  const site = useSiteAppearance();
  const [methodIndex, setMethodIndex] = useState(0);
  const [showAddress, setShowAddress] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  if (!client) {
    return <MissingApplicationId />;
  }
  if (!site) {
    return null;
  }

  const paymentMethods = METHOD_CHOICES[methodIndex]!.value;
  // Options are frozen when the hosted form is created, so changing them needs
  // a new instanceKey. Anything in the key recreates the form (and clears it).
  const instanceKey = `${site.instanceKey}:${paymentMethods.join("+")}:${showAddress ? "address" : "no-address"}`;

  return (
    <ExampleFrame>
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <div role="radiogroup" aria-label="Payment methods" className="flex items-center gap-3">
          {METHOD_CHOICES.map((choice, index) => (
            <label key={choice.label} className="inline-flex cursor-pointer items-center gap-1.5">
              <input
                type="radio"
                name="payment-methods"
                checked={methodIndex === index}
                onChange={() => setMethodIndex(index)}
                className="accent-accent-link"
              />
              {choice.label}
            </label>
          ))}
        </div>
        <label className="inline-flex cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            checked={showAddress}
            onChange={(event) => setShowAddress(event.target.checked)}
            className="accent-accent-link"
          />
          Show address
        </label>
      </div>

      <FinixPaymentForm
        client={client}
        options={{ paymentMethods, showAddress, ...site.appearance }}
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
