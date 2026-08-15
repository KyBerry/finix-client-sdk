import { FinixSdkError } from "./errors";
import { DEFAULT_SUBMISSION_TIMEOUT_MS, withAsyncControls } from "./internal/async";
import { isRecord, type NativePaymentForm } from "./internal/native";
import { finixTokenResponseSchema } from "./schemas";
import type {
  FinixAsyncOptions,
  FinixBinInformation,
  FinixFormState,
  FinixOnChange,
  FinixOnError,
  FinixOnSubmit,
  FinixOnSubmitResult,
  FinixOnUpdate,
  FinixSubmitResponse,
} from "./types";

interface PendingSubmission {
  id: number;
  resolve: (response: FinixSubmitResponse) => void;
  reject: (error: FinixSdkError) => void;
}

interface PaymentFormCallbacks {
  onUpdate?: FinixOnUpdate;
  onChange?: FinixOnChange;
  onSubmit?: FinixOnSubmit;
  onSubmitResult?: FinixOnSubmitResult;
  onError?: FinixOnError;
}

function sanitizeFieldState(fieldName: string, value: unknown): FinixFormState[string] {
  if (!isRecord(value)) {
    return undefined;
  }

  const field: Record<string, unknown> = {};
  for (const key of ["errors", "isDirty", "isFocused"] as const) {
    if (typeof value[key] === "boolean") {
      field[key] = value[key];
    }
  }
  if (Array.isArray(value.errorMessages) && value.errorMessages.every((message) => typeof message === "string")) {
    field.errorMessages = [...value.errorMessages];
  }
  if (typeof value.selected === "string") {
    field.selected = value.selected;
  }
  if ((fieldName === "address.country" || fieldName === "address_country" || fieldName === "current_payment_method") && typeof value.value === "string") {
    field.value = value.value;
  }
  return field;
}

export function sanitizeFormState(value: unknown): FinixFormState {
  if (!isRecord(value)) {
    return {};
  }

  const state: Record<string, FinixFormState[string]> = {};
  for (const [fieldName, fieldValue] of Object.entries(value)) {
    state[fieldName] = sanitizeFieldState(fieldName, fieldValue);
  }
  return state;
}

export function sanitizeBinInformation(value: unknown): FinixBinInformation {
  if (!isRecord(value)) {
    return {};
  }
  return {
    ...(typeof value.bin === "string" ? { bin: value.bin } : {}),
    ...(typeof value.cardBrand === "string" ? { cardBrand: value.cardBrand } : {}),
  };
}

/** A lifecycle-safe wrapper around the form instance returned by Finix.js. */
export class PaymentFormInstance {
  readonly #native: NativePaymentForm;
  readonly #mountNode: HTMLElement;
  readonly #callbacks: PaymentFormCallbacks;
  readonly #defaultSubmissionTimeoutMs: number;
  #destroyed = false;
  #submissionSequence = 0;
  #pendingSubmission: PendingSubmission | undefined;
  #state: FinixFormState = {};
  #binInformation: FinixBinInformation = {};
  #hasErrors = true;

  /** @internal Instances are created by FinixClient.mount(). */
  public constructor(
    native: NativePaymentForm,
    mountNode: HTMLElement,
    callbacks: PaymentFormCallbacks,
    defaultSubmissionTimeoutMs = DEFAULT_SUBMISSION_TIMEOUT_MS,
  ) {
    this.#native = native;
    this.#mountNode = mountNode;
    this.#callbacks = callbacks;
    this.#defaultSubmissionTimeoutMs = defaultSubmissionTimeoutMs;
  }

  public get state(): FinixFormState {
    return this.#state;
  }

  public get binInformation(): FinixBinInformation {
    return this.#binInformation;
  }

  public get hasErrors(): boolean {
    return this.#hasErrors;
  }

  public get destroyed(): boolean {
    return this.#destroyed;
  }

  /** @internal Receives only the public callback boundary exposed by Finix.js. */
  public handleUpdate(state: unknown, binInformation: unknown, hasErrors: unknown): void {
    if (this.#destroyed) {
      return;
    }
    this.#state = sanitizeFormState(state);
    this.#binInformation = sanitizeBinInformation(binInformation);
    this.#hasErrors = typeof hasErrors === "boolean" ? hasErrors : true;
    this.#safeCallback(() => this.#callbacks.onUpdate?.(this.#state, this.#binInformation, this.#hasErrors));
    this.#safeCallback(() =>
      this.#callbacks.onChange?.({ state: this.#state, binInformation: this.#binInformation, hasErrors: this.#hasErrors }),
    );

    if (typeof hasErrors !== "boolean") {
      this.#notifyError(new FinixSdkError("invalid_response", "Finix onUpdate returned a non-boolean hasErrors value.", { details: hasErrors }));
    }
  }

  /** @internal Receives only the public callback boundary exposed by Finix.js. */
  public handleSubmit(error: unknown | null, response: unknown | null, submissionId?: number): void {
    if (this.#destroyed) {
      return;
    }

    let normalizedError: FinixSdkError | null = null;
    let normalizedResponse: FinixSubmitResponse | null = null;

    if (error !== null && response === null) {
      normalizedError = new FinixSdkError("tokenization_failed", "Finix could not tokenize the payment instrument.", {
        cause: error,
        details: error,
      });
    } else if (error === null && response !== null) {
      const parsed = finixTokenResponseSchema.safeParse(response);
      if (parsed.success) {
        normalizedResponse = { ...parsed.data, token: parsed.data.data.id };
      } else {
        normalizedError = new FinixSdkError("invalid_response", "Finix returned an invalid token response.", {
          cause: parsed.error,
          details: parsed.error.issues,
        });
      }
    } else {
      normalizedError = new FinixSdkError(
        "invalid_response",
        "Finix must return exactly one of an error or a token response.",
        { details: { error, response } },
      );
    }

    const pending = submissionId !== undefined && this.#pendingSubmission?.id === submissionId
      ? this.#pendingSubmission
      : undefined;
    if (pending) {
      this.#pendingSubmission = undefined;
      if (normalizedResponse) {
        pending.resolve(normalizedResponse);
      } else {
        pending.reject(normalizedError ?? new FinixSdkError("invalid_response", "Finix returned no token response."));
      }
    }

    if (normalizedError) {
      const failure = normalizedError;
      this.#safeCallback(() => this.#callbacks.onSubmit?.(failure, null));
      this.#safeCallback(() => this.#callbacks.onSubmitResult?.({ ok: false, token: null, response: null, error: failure }));
    } else if (normalizedResponse) {
      const success = normalizedResponse;
      this.#safeCallback(() => this.#callbacks.onSubmit?.(null, success));
      this.#safeCallback(() =>
        this.#callbacks.onSubmitResult?.({ ok: true, token: success.token, response: success, error: null }),
      );
    }
  }

  /**
   * Asks Finix to tokenize what the user typed. Resolves with the validated
   * response; `token` is the value to send to your backend.
   */
  public submit(options: FinixAsyncOptions = {}): Promise<FinixSubmitResponse> {
    if (this.#destroyed) {
      return Promise.reject(new FinixSdkError("destroyed", "This payment form has been destroyed."));
    }
    if (this.#pendingSubmission) {
      return Promise.reject(new FinixSdkError("submission_in_progress", "A tokenization request is already in progress."));
    }

    const submissionId = ++this.#submissionSequence;
    const operation = new Promise<FinixSubmitResponse>((resolve, reject) => {
      this.#pendingSubmission = { id: submissionId, resolve, reject };
      try {
        this.#native.submit((error, response) => this.handleSubmit(error, response, submissionId));
      } catch (error: unknown) {
        this.#pendingSubmission = undefined;
        reject(FinixSdkError.from(error, "tokenization_failed", "Finix submit failed."));
      }
    });

    return withAsyncControls(operation, options, this.#defaultSubmissionTimeoutMs, "Finix tokenization").finally(() => {
      if (this.#pendingSubmission?.id === submissionId) {
        this.#pendingSubmission = undefined;
      }
    });
  }

  /**
   * Idempotently cleans up this wrapper's form. The vendor's undocumented
   * destroy capability is used when available, with owned-DOM cleanup as a
   * fallback.
   */
  public destroy(): void {
    if (this.#destroyed) {
      return;
    }
    this.#destroyed = true;
    const pending = this.#pendingSubmission;
    this.#pendingSubmission = undefined;
    pending?.reject(new FinixSdkError("destroyed", "The payment form was destroyed during tokenization."));

    try {
      this.#native.destroy?.();
    } catch (error: unknown) {
      this.#notifyError(FinixSdkError.from(error, "payment_form_unavailable", "Finix form cleanup failed."));
    } finally {
      this.#mountNode.replaceChildren();
      this.#mountNode.remove();
    }
  }

  #safeCallback(callback: () => void): void {
    try {
      callback();
    } catch (error: unknown) {
      this.#notifyError(FinixSdkError.from(error, "callback_error", "A Finix SDK callback threw an error."));
    }
  }

  #notifyError(error: FinixSdkError): void {
    try {
      this.#callbacks.onError?.(error);
    } catch {
      // Consumer error handlers cannot be allowed to corrupt SDK lifecycle.
    }
  }
}
