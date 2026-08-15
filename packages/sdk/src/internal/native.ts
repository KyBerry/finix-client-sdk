import type { FinixPaymentFormOptions } from "../types";

export type NativeSubmitCallback = (error: unknown | null, response: unknown | null) => void;

export interface NativePaymentForm {
  submit(callback: NativeSubmitCallback): void;
  /** Present in the current CDN artifact but not in the documented API. */
  destroy?: () => void;
}

export interface NativePaymentFormOptions extends Omit<FinixPaymentFormOptions, "onLoad" | "onUpdate" | "onSubmit" | "onError"> {
  onLoad?: () => void;
  onUpdate?: (state: unknown, binInformation: unknown, hasErrors: unknown) => void;
  onSubmit?: NativeSubmitCallback;
}

export interface NativeFinixAuth {
  getSessionKey(): string | undefined;
  connect(merchantId: string, callback?: (sessionKey: string) => void): void;
}

export interface FinixGlobal {
  PaymentForm(
    element: string | HTMLElement,
    environment: "sandbox" | "prod",
    applicationId: string,
    options?: NativePaymentFormOptions,
  ): NativePaymentForm | undefined;
  Auth?: (
    environment: "sandbox" | "live",
    merchantId: string,
    callback?: (sessionKey: string) => void,
  ) => NativeFinixAuth | undefined;
}

declare global {
  interface Window {
    Finix?: unknown;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isFinixGlobal(value: unknown): value is FinixGlobal {
  return isRecord(value) && typeof value.PaymentForm === "function";
}

export function isNativePaymentForm(value: unknown): value is NativePaymentForm {
  return isRecord(value) && typeof value.submit === "function";
}

export function isNativeFinixAuth(value: unknown): value is NativeFinixAuth {
  return isRecord(value) && typeof value.getSessionKey === "function" && typeof value.connect === "function";
}
