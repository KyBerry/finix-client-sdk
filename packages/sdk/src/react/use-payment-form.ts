import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FinixClient } from "../client";
import { FinixSdkError } from "../errors";
import { PaymentFormInstance } from "../payment-form";
import type {
  FinixAsyncOptions,
  FinixBinInformation,
  FinixFormState,
  FinixPaymentFormOptions,
  FinixSubmitResponse,
} from "../types";

export type FinixPaymentFormStatus = "idle" | "loading" | "ready" | "error";
export type FinixPaymentFormInstanceKey = string | number;

export interface UseFinixPaymentFormOptions {
  client: FinixClient;
  options?: FinixPaymentFormOptions;
  onReady?: (form: PaymentFormInstance) => void;
  /**
   * Explicitly replaces the hosted iframe when this primitive value changes.
   * All other option changes are applied only to callbacks for the current
   * instance and otherwise take effect the next time an instance is created.
   */
  instanceKey?: FinixPaymentFormInstanceKey;
}

export interface UseFinixPaymentFormResult {
  /** Attach to the single element that should own the hosted Finix iframe. */
  ref: (element: HTMLDivElement | null) => void;
  status: FinixPaymentFormStatus;
  error: FinixSdkError | null;
  submissionError: FinixSdkError | null;
  form: PaymentFormInstance | null;
  state: FinixFormState;
  binInformation: FinixBinInformation;
  hasErrors: boolean;
  isSubmitting: boolean;
  canSubmit: boolean;
  clearSubmissionError: () => void;
  submit: (options?: FinixAsyncOptions) => Promise<FinixSubmitResponse>;
}

const EMPTY_OPTIONS: FinixPaymentFormOptions = {};

// Bundlers substitute the literal `process.env.NODE_ENV`; a bare `process`
// reference may not exist in the browser, so the read is guarded with try/catch.
const isDevelopment = ((): boolean => {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
})();

/** Serializes the non-callback options so a changed snapshot can be detected in development. */
function snapshotOptions(options: FinixPaymentFormOptions): string {
  return JSON.stringify(options, (_key, value: unknown) => (typeof value === "function" ? undefined : value));
}

/**
 * Headless React controller for one hosted Finix form. Options are snapshotted
 * when an instance is created. Callback changes stay live without replacing
 * the iframe; change instanceKey when replacement is intentional.
 */
export function useFinixPaymentForm({
  client,
  options = EMPTY_OPTIONS,
  onReady,
  instanceKey,
}: UseFinixPaymentFormOptions): UseFinixPaymentFormResult {
  if (
    instanceKey !== undefined
    && typeof instanceKey !== "string"
    && (typeof instanceKey !== "number" || !Number.isFinite(instanceKey))
  ) {
    throw new FinixSdkError(
      "invalid_configuration",
      "instanceKey must be a string or a finite number.",
    );
  }
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<FinixPaymentFormStatus>("idle");
  const [error, setError] = useState<FinixSdkError | null>(null);
  const [submissionError, setSubmissionError] = useState<FinixSdkError | null>(null);
  const [form, setForm] = useState<PaymentFormInstance | null>(null);
  const [state, setState] = useState<FinixFormState>({});
  const [binInformation, setBinInformation] = useState<FinixBinInformation>({});
  const [hasErrors, setHasErrors] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<PaymentFormInstance | null>(null);
  const submissionRef = useRef<Promise<FinixSubmitResponse> | null>(null);
  const optionsRef = useRef(options);
  const onReadyRef = useRef(onReady);
  const mountedSnapshotRef = useRef<string | null>(null);
  const mountedKeyRef = useRef<FinixPaymentFormInstanceKey | undefined>(undefined);
  const warnedRef = useRef(false);
  optionsRef.current = options;
  onReadyRef.current = onReady;

  useEffect(() => {
    if (
      !isDevelopment
      || mountedSnapshotRef.current === null
      || warnedRef.current
      || mountedKeyRef.current !== instanceKey
    ) {
      // A changed instanceKey means a remount is coming; nothing to warn about.
      return;
    }
    if (snapshotOptions(options) !== mountedSnapshotRef.current) {
      warnedRef.current = true;
      console.warn(
        "[finix-client-sdk] Payment form options changed after the hosted form was created. "
        + "Options are snapshotted at mount, so the change was not applied. "
        + "Change instanceKey to recreate the form (this clears what the user typed), or move the value into a callback.",
      );
    }
  }, [options, instanceKey]);

  useEffect(() => {
    if (!element) {
      return;
    }

    let active = true;
    const controller = new AbortController();
    const currentOptions = optionsRef.current;
    mountedSnapshotRef.current = snapshotOptions(currentOptions);
    mountedKeyRef.current = instanceKey;
    warnedRef.current = false;
    setStatus("loading");
    setError(null);
    setSubmissionError(null);
    setForm(null);
    setState({});
    setBinInformation({});
    setHasErrors(true);
    setIsSubmitting(false);
    submissionRef.current = null;

    void client
      .mount(
        element,
        {
          ...currentOptions,
          onLoad: () => {
            if (active) {
              optionsRef.current.onLoad?.();
            }
          },
          onUpdate: (nextState, nextBinInformation, nextHasErrors) => {
            if (!active) {
              return;
            }
            setState(nextState);
            setBinInformation(nextBinInformation);
            setHasErrors(nextHasErrors);
            optionsRef.current.onUpdate?.(nextState, nextBinInformation, nextHasErrors);
            optionsRef.current.onChange?.({ state: nextState, binInformation: nextBinInformation, hasErrors: nextHasErrors });
          },
          onChange: undefined,
          onSubmit: currentOptions.onSubmit || currentOptions.onSubmitResult
            ? (submitError, response) => {
                if (!active) {
                  return;
                }
                if (submitError) {
                  optionsRef.current.onSubmit?.(submitError, null);
                  optionsRef.current.onSubmitResult?.({ ok: false, token: null, response: null, error: submitError });
                } else if (response) {
                  optionsRef.current.onSubmit?.(null, response);
                  optionsRef.current.onSubmitResult?.({ ok: true, token: response.token, response, error: null });
                }
              }
            : undefined,
          onSubmitResult: undefined,
          onError: (nextError) => {
            if (!active) {
              return;
            }
            setError(nextError);
            setStatus("error");
            optionsRef.current.onError?.(nextError);
          },
        },
        { signal: controller.signal },
      )
      .then((nextForm) => {
        if (!active) {
          nextForm.destroy();
          return;
        }
        formRef.current = nextForm;
        setForm(nextForm);
        setStatus("ready");
        try {
          onReadyRef.current?.(nextForm);
        } catch (callbackError: unknown) {
          const normalized = FinixSdkError.from(callbackError, "callback_error", "The React onReady callback threw an error.");
          setError(normalized);
          try {
            optionsRef.current.onError?.(normalized);
          } catch {
            // Consumer error handlers cannot corrupt the mounted form.
          }
        }
      })
      .catch((mountError: unknown) => {
        const normalized = FinixSdkError.from(mountError, "payment_form_unavailable", "Finix payment form mount failed.");
        if (!active || normalized.code === "aborted") {
          return;
        }
        setError(normalized);
        setStatus("error");
      });

    return () => {
      active = false;
      controller.abort();
      submissionRef.current = null;
      formRef.current?.destroy();
      formRef.current = null;
    };
  }, [client, element, instanceKey]);

  const clearSubmissionError = useCallback(() => setSubmissionError(null), []);

  const submit = useCallback((submitOptions?: FinixAsyncOptions): Promise<FinixSubmitResponse> => {
    const current = formRef.current;
    if (!current) {
      const unavailable = new FinixSdkError("payment_form_unavailable", "The Finix payment form is not ready.");
      setSubmissionError(unavailable);
      return Promise.reject(unavailable);
    }
    if (submissionRef.current) {
      const inProgress = new FinixSdkError("submission_in_progress", "A tokenization request is already in progress.");
      setSubmissionError(inProgress);
      return Promise.reject(inProgress);
    }

    setSubmissionError(null);
    setIsSubmitting(true);
    const trackedSubmission = current
      .submit(submitOptions)
      .then((response) => {
        if (formRef.current === current) {
          setSubmissionError(null);
        }
        return response;
      })
      .catch((submitError: unknown) => {
        const normalized = FinixSdkError.from(submitError, "tokenization_failed", "Finix tokenization failed.");
        if (formRef.current === current) {
          setSubmissionError(normalized);
        }
        throw normalized;
      })
      .finally(() => {
        if (submissionRef.current === trackedSubmission) {
          submissionRef.current = null;
          if (formRef.current === current) {
            setIsSubmitting(false);
          }
        }
      });
    submissionRef.current = trackedSubmission;
    return trackedSubmission;
  }, []);

  const canSubmit = status === "ready" && !hasErrors && !isSubmitting;

  return useMemo(
    () => ({
      ref: setElement,
      status,
      error,
      submissionError,
      form,
      state,
      binInformation,
      hasErrors,
      isSubmitting,
      canSubmit,
      clearSubmissionError,
      submit,
    }),
    [
      status,
      error,
      submissionError,
      form,
      state,
      binInformation,
      hasErrors,
      isSubmitting,
      canSubmit,
      clearSubmissionError,
      submit,
    ],
  );
}
