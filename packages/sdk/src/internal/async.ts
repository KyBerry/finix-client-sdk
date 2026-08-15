import { FinixSdkError } from "../errors";
import type { FinixAsyncOptions } from "../types";

export const DEFAULT_SCRIPT_TIMEOUT_MS = 15_000;
export const DEFAULT_FORM_READY_TIMEOUT_MS = 20_000;
export const DEFAULT_SUBMISSION_TIMEOUT_MS = 30_000;

export function validateTimeout(timeoutMs: number | undefined, fallback: number, label: string): number {
  if (timeoutMs === undefined) {
    return fallback;
  }

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new FinixSdkError("invalid_configuration", `${label} must be a positive finite number.`);
  }

  return timeoutMs;
}

export function abortedError(): FinixSdkError {
  return new FinixSdkError("aborted", "The Finix operation was aborted.");
}

export function timeoutError(operation: string, timeoutMs: number): FinixSdkError {
  return new FinixSdkError("timeout", `${operation} timed out after ${timeoutMs}ms.`);
}

export function withAsyncControls<T>(
  promise: Promise<T>,
  options: FinixAsyncOptions | undefined,
  fallbackTimeoutMs: number,
  operation: string,
): Promise<T> {
  const timeoutMs = validateTimeout(options?.timeoutMs, fallbackTimeoutMs, `${operation} timeout`);

  if (options?.signal?.aborted) {
    return Promise.reject(abortedError());
  }

  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const finish = (callback: () => void): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      options?.signal?.removeEventListener("abort", handleAbort);
      callback();
    };
    const handleAbort = (): void => finish(() => reject(abortedError()));
    const timer = setTimeout(() => finish(() => reject(timeoutError(operation, timeoutMs))), timeoutMs);

    options?.signal?.addEventListener("abort", handleAbort, { once: true });
    promise.then(
      (value) => finish(() => resolve(value)),
      (error: unknown) => finish(() => reject(error)),
    );
  });
}
