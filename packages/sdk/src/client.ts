import { FinixSdkError } from "./errors";
import { DEFAULT_FORM_READY_TIMEOUT_MS, DEFAULT_SUBMISSION_TIMEOUT_MS, withAsyncControls } from "./internal/async";
import { isNativePaymentForm, type NativePaymentForm, type NativePaymentFormOptions } from "./internal/native";
import { loadFinix } from "./loader";
import { PaymentFormInstance } from "./payment-form";
import type { FinixAsyncOptions, FinixClientConfig, FinixPaymentFormOptions } from "./types";
import { resolveMountElement, validateClientConfig, validatePaymentFormOptions } from "./validation";

interface QueuedUpdate {
  state: unknown;
  binInformation: unknown;
  hasErrors: unknown;
}

interface QueuedSubmit {
  error: unknown | null;
  response: unknown | null;
}

export class FinixClient {
  readonly #config: FinixClientConfig;

  public constructor(config: FinixClientConfig) {
    validateClientConfig(config);
    this.#config = { ...config, script: config.script ? { ...config.script } : undefined };
  }

  public async mount(
    element: string | HTMLElement,
    options: FinixPaymentFormOptions = {},
    asyncOptions: FinixAsyncOptions = {},
  ): Promise<PaymentFormInstance> {
    validatePaymentFormOptions(options);
    const finix = await loadFinix({ ...this.#config.script, signal: asyncOptions.signal });
    const host = resolveMountElement(element);
    const mountNode = document.createElement("div");
    mountNode.dataset.finixPaymentForm = "v2";
    host.append(mountNode);

    const { onError, onLoad, onUpdate, onChange, onSubmit, onSubmitResult, ...forwardedOptions } = options;
    let instance: PaymentFormInstance | undefined;
    let native: NativePaymentForm | undefined;
    let callbacksActive = true;
    let loaded = false;
    let loadNotified = false;
    const queuedUpdates: QueuedUpdate[] = [];
    const queuedSubmits: QueuedSubmit[] = [];
    let resolveReady: ((form: PaymentFormInstance) => void) | undefined;
    let rejectReady: ((error: FinixSdkError) => void) | undefined;
    const ready = new Promise<PaymentFormInstance>((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });

    const notifyError = (error: FinixSdkError): void => {
      try {
        onError?.(error);
      } catch {
        // Consumer callbacks cannot be allowed to corrupt SDK lifecycle.
      }
    };
    const safeOnLoad = (): void => {
      if (!callbacksActive || instance?.destroyed || loadNotified) {
        return;
      }
      loadNotified = true;
      // Finix animates validation rows open while resizing its iframe a frame
      // behind the content, which briefly makes the hosted document scrollable.
      // The iframe is auto-sized to fit, so its internal scrollbar must never
      // render; only this container attribute can suppress it cross-origin.
      for (const frame of mountNode.querySelectorAll("iframe")) {
        frame.setAttribute("scrolling", "no");
      }
      if (instance) {
        resolveReady?.(instance);
      } else {
        loaded = true;
      }
      try {
        onLoad?.();
      } catch (error: unknown) {
        notifyError(FinixSdkError.from(error, "callback_error", "The onLoad callback threw an error."));
      }
    };

    const nativeOptions: NativePaymentFormOptions = {
      ...forwardedOptions,
      onLoad: safeOnLoad,
      onUpdate: (state, binInformation, hasErrors) => {
        if (!callbacksActive) {
          return;
        }
        if (instance) {
          instance.handleUpdate(state, binInformation, hasErrors);
        } else {
          queuedUpdates.push({ state, binInformation, hasErrors });
        }
      },
      ...(onSubmit || onSubmitResult
        ? {
            onSubmit: (error: unknown | null, response: unknown | null) => {
              if (!callbacksActive) {
                return;
              }
              if (instance) {
                instance.handleSubmit(error, response);
              } else {
                queuedSubmits.push({ error, response });
              }
            },
          }
        : {}),
    };

    try {
      native = finix.PaymentForm(mountNode, this.#config.environment, this.#config.applicationId, nativeOptions);
      if (!isNativePaymentForm(native)) {
        throw new FinixSdkError("payment_form_unavailable", "Finix.PaymentForm did not return a form instance.");
      }

      instance = new PaymentFormInstance(
        native,
        mountNode,
        { onError, onUpdate, onChange, onSubmit, onSubmitResult },
        this.#config.submissionTimeoutMs ?? DEFAULT_SUBMISSION_TIMEOUT_MS,
      );
      for (const queuedUpdate of queuedUpdates) {
        instance.handleUpdate(queuedUpdate.state, queuedUpdate.binInformation, queuedUpdate.hasErrors);
      }
      for (const queuedSubmit of queuedSubmits) {
        instance.handleSubmit(queuedSubmit.error, queuedSubmit.response);
      }
      if (loaded) {
        resolveReady?.(instance);
      }

      return await withAsyncControls(
        ready,
        asyncOptions,
        this.#config.formReadyTimeoutMs ?? DEFAULT_FORM_READY_TIMEOUT_MS,
        "Finix payment form initialization",
      );
    } catch (error: unknown) {
      callbacksActive = false;
      const normalized = FinixSdkError.from(error, "payment_form_unavailable", "Finix payment form initialization failed.");
      rejectReady?.(normalized);
      instance?.destroy();
      if (!instance) {
        try {
          native?.destroy?.();
        } finally {
          mountNode.replaceChildren();
          mountNode.remove();
        }
      }
      notifyError(normalized);
      throw normalized;
    }
  }
}
