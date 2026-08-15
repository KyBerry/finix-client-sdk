import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";

import { FinixSdkError } from "../errors";
import {
  useFinixPaymentForm,
  type UseFinixPaymentFormOptions,
  type UseFinixPaymentFormResult,
} from "./use-payment-form";

interface HostOwner {
  owner: object;
  element: HTMLDivElement;
}

interface PaymentFormContextValue {
  controller: UseFinixPaymentFormResult;
  attachHost: (owner: object, element: HTMLDivElement | null) => void;
}

const PaymentFormContext = createContext<PaymentFormContextValue | null>(null);

export interface FinixPaymentFormRootProps extends UseFinixPaymentFormOptions {
  children: ReactNode;
}

/** Provides one headless Finix form controller without rendering application UI. */
export function FinixPaymentFormRoot({ children, ...controllerOptions }: FinixPaymentFormRootProps): ReactElement {
  const controller = useFinixPaymentForm(controllerOptions);
  const ownerRef = useRef<HostOwner | null>(null);
  const mountRef = controller.ref;
  const attachHost = useCallback(
    (owner: object, element: HTMLDivElement | null): void => {
      const current = ownerRef.current;
      if (element) {
        if (current && current.owner !== owner) {
          throw new FinixSdkError(
            "invalid_configuration",
            "FinixForm.Root can own exactly one attached FinixForm.Host.",
          );
        }
        if (current?.element === element) {
          return;
        }
        ownerRef.current = { owner, element };
        mountRef(element);
        return;
      }
      if (current?.owner === owner) {
        ownerRef.current = null;
        mountRef(null);
      }
    },
    [mountRef],
  );
  const context = useMemo<PaymentFormContextValue>(
    () => ({ controller, attachHost }),
    [controller, attachHost],
  );
  return <PaymentFormContext.Provider value={context}>{children}</PaymentFormContext.Provider>;
}

function usePaymentFormContextValue(): PaymentFormContextValue {
  const context = useContext(PaymentFormContext);
  if (!context) {
    throw new FinixSdkError(
      "invalid_configuration",
      "useFinixPaymentFormContext must be used inside FinixForm.Root.",
    );
  }
  return context;
}

export function useFinixPaymentFormContext(): UseFinixPaymentFormResult {
  return usePaymentFormContextValue().controller;
}

export interface FinixPaymentFormHostProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "dangerouslySetInnerHTML"> {
  children?: never;
  dangerouslySetInnerHTML?: never;
}

/**
 * The only required DOM primitive. It owns the hosted iframe while forwarding
 * className, style, ARIA attributes, data attributes, and refs to the caller.
 */
export const FinixPaymentFormHost = forwardRef<HTMLDivElement, FinixPaymentFormHostProps>(
  function FinixPaymentFormHost(
    {
      "aria-busy": ariaBusy,
      children,
      dangerouslySetInnerHTML,
      ...hostProps
    },
    forwardedRef,
  ): ReactElement {
    if (children !== undefined || dangerouslySetInnerHTML !== undefined) {
      throw new FinixSdkError(
        "invalid_configuration",
        "FinixForm.Host cannot render children or dangerouslySetInnerHTML.",
      );
    }
    const { controller, attachHost } = usePaymentFormContextValue();
    const ownerRef = useRef<object>({});
    const setHostRef = useCallback(
      (element: HTMLDivElement | null) => {
        attachHost(ownerRef.current, element);
        if (typeof forwardedRef === "function") {
          forwardedRef(element);
        } else if (forwardedRef) {
          forwardedRef.current = element;
        }
      },
      [attachHost, forwardedRef],
    );

    const reportedError = controller.submissionError ?? controller.error;
    return (
      <div
        {...hostProps}
        ref={setHostRef}
        aria-busy={ariaBusy ?? (controller.status === "loading" || controller.isSubmitting)}
        data-finix-status={controller.status}
        data-finix-valid={controller.status === "ready" ? String(!controller.hasErrors) : undefined}
        data-finix-submitting={String(controller.isSubmitting)}
        data-finix-error={reportedError?.code}
      />
    );
  },
);

export interface FinixPaymentFormConsumerProps {
  children: (controller: UseFinixPaymentFormResult) => ReactNode;
}

/** Render-prop access for consumers that prefer composition over hooks. */
export function FinixPaymentFormConsumer({ children }: FinixPaymentFormConsumerProps): ReactElement {
  return <>{children(useFinixPaymentFormContext())}</>;
}

/**
 * Namespaced, unstyled primitives. Named exports are also available for
 * consumers that prefer direct imports.
 */
export const FinixForm = Object.freeze({
  Root: FinixPaymentFormRoot,
  Host: FinixPaymentFormHost,
  Consumer: FinixPaymentFormConsumer,
});
