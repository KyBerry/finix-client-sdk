import { useMemo } from "react";

import { resolveFinixAppearance } from "../appearance";
import { FinixClient } from "../client";
import type {
  FinixClientConfig,
  FinixColorScheme,
  FinixHostedAppearance,
} from "../types";

/**
 * Creates one FinixClient for the lifetime of the component and only rebuilds
 * it when a config value actually changes. Saves hand-writing useMemo.
 */
export function useFinixClient(config: FinixClientConfig): FinixClient {
  const { environment, applicationId, formReadyTimeoutMs, submissionTimeoutMs } = config;
  const nonce = config.script?.nonce;
  const scriptTimeoutMs = config.script?.timeoutMs;
  return useMemo(
    () =>
      new FinixClient({
        environment,
        applicationId,
        ...(formReadyTimeoutMs !== undefined ? { formReadyTimeoutMs } : {}),
        ...(submissionTimeoutMs !== undefined ? { submissionTimeoutMs } : {}),
        ...(nonce !== undefined || scriptTimeoutMs !== undefined
          ? { script: { ...(nonce !== undefined ? { nonce } : {}), ...(scriptTimeoutMs !== undefined ? { timeoutMs: scriptTimeoutMs } : {}) } }
          : {}),
      }),
    [environment, applicationId, formReadyTimeoutMs, submissionTimeoutMs, nonce, scriptTimeoutMs],
  );
}

export interface UseFinixAppearanceResult {
  /** Spread into `options`; contains only the styles for the current scheme. */
  appearance: ReturnType<typeof resolveFinixAppearance>;
  /** Pass as `instanceKey` so the hosted form is recreated when the scheme changes. */
  instanceKey: string;
}

/**
 * Turns one appearance object (with `styles.default` and `styles.dark`) into
 * the flattened appearance for the scheme your app is showing, plus an
 * instanceKey that changes with the scheme.
 *
 * @example
 * const { appearance, instanceKey } = useFinixAppearance(brand, resolvedTheme);
 * <FinixForm.Root client={client} options={{ paymentMethods: ["card"], ...appearance }} instanceKey={instanceKey}>
 */
export function useFinixAppearance(
  appearance: FinixHostedAppearance,
  scheme: FinixColorScheme,
  extraKey?: string | number,
): UseFinixAppearanceResult {
  return useMemo(
    () => ({
      appearance: resolveFinixAppearance(appearance, scheme),
      instanceKey: extraKey === undefined ? scheme : `${scheme}:${extraKey}`,
    }),
    [appearance, scheme, extraKey],
  );
}
