import { forwardRef, useCallback, type HTMLAttributes, type ReactElement, type ReactNode } from "react";

import { FinixSdkError } from "../errors";
import {
  useFinixPaymentForm,
  type UseFinixPaymentFormOptions,
  type UseFinixPaymentFormResult,
} from "./use-payment-form";

export interface FinixPaymentFormProps
  extends Omit<
      HTMLAttributes<HTMLDivElement>,
      "children" | "dangerouslySetInnerHTML" | "onError" | "onSubmit" | "onChange"
    >,
    UseFinixPaymentFormOptions {
  /**
   * Optional render prop. Receives the same controller as `FinixForm.Consumer`
   * and is rendered right after the host element, so you can add your own
   * button and status without switching to the headless primitives.
   */
  children?: (controller: UseFinixPaymentFormResult) => ReactNode;
  dangerouslySetInnerHTML?: never;
}

/**
 * One-tag host: mounts the hosted iframe in a `div` and, if you pass a function
 * as children, hands you the controller for your own button and status UI.
 * Use FinixForm.Root/Host/Consumer when you need to place those elsewhere.
 */
export const FinixPaymentForm = forwardRef<HTMLDivElement, FinixPaymentFormProps>(function FinixPaymentForm(
  {
    client,
    options,
    onReady,
    instanceKey,
    "aria-busy": ariaBusy,
    children,
    dangerouslySetInnerHTML,
    ...hostProps
  },
  forwardedRef,
): ReactElement {
  if ((children !== undefined && typeof children !== "function") || dangerouslySetInnerHTML !== undefined) {
    throw new FinixSdkError(
      "invalid_configuration",
      "FinixPaymentForm children must be a function that receives the controller; static children and dangerouslySetInnerHTML are not allowed because Finix owns the mount node.",
    );
  }
  const controller = useFinixPaymentForm({ client, options, onReady, instanceKey });
  const mountRef = controller.ref;
  const setHostRef = useCallback(
    (element: HTMLDivElement | null) => {
      mountRef(element);
      if (typeof forwardedRef === "function") {
        forwardedRef(element);
      } else if (forwardedRef) {
        forwardedRef.current = element;
      }
    },
    [mountRef, forwardedRef],
  );
  const reportedError = controller.submissionError ?? controller.error;

  const host = (
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

  if (!children) {
    return host;
  }
  return (
    <>
      {host}
      {children(controller)}
    </>
  );
});
