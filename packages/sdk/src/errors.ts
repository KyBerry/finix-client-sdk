export const FINIX_SDK_ERROR_CODES = [
  "not_browser",
  "invalid_configuration",
  "script_load_failed",
  "script_conflict",
  "finix_unavailable",
  "payment_form_unavailable",
  "auth_unavailable",
  "tokenization_failed",
  "invalid_response",
  "callback_error",
  "submission_in_progress",
  "destroyed",
  "timeout",
  "aborted",
] as const;

export type FinixSdkErrorCode = (typeof FINIX_SDK_ERROR_CODES)[number];

export class FinixSdkError extends Error {
  public readonly code: FinixSdkErrorCode;
  public readonly details?: unknown;

  public constructor(code: FinixSdkErrorCode, message: string, options?: { cause?: unknown; details?: unknown }) {
    super(message, options?.cause === undefined ? undefined : { cause: options.cause });
    this.name = "FinixSdkError";
    this.code = code;
    this.details = options?.details;
  }

  public static from(error: unknown, code: FinixSdkErrorCode, fallbackMessage: string): FinixSdkError {
    if (error instanceof FinixSdkError) {
      return error;
    }

    return new FinixSdkError(code, error instanceof Error ? error.message : fallbackMessage, {
      cause: error,
      details: error,
    });
  }
}
