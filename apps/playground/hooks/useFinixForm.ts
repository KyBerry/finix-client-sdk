import { useRef, useState, useEffect, useCallback } from "react";
import { PaymentFormCreator, FINIX_ENVIRONMENT, type EnvironmentConfig, type FormConfig, type FormState, type FieldName } from "@kyberry/finix-client-sdk";

interface UseFinixFormProps {
  onTokenize?: (token: string) => void;
  onError?: (error: unknown) => void;
  showAddress?: boolean;
  showLabels?: boolean;
  applicationId?: string;
  merchantId?: string;
  enableFraudDetection?: boolean;
}

export function useFinixForm({
  onTokenize,
  onError,
  showAddress = true,
  showLabels = true,
  applicationId = "AIDxxxxxxxxxxxxxxx", // Replace with your actual Application ID
  merchantId = "MIDxxxxxxxxxxxxxxx", // Replace with your actual Merchant ID
  enableFraudDetection = false,
}: UseFinixFormProps = {}) {
  const formContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const formInitializedRef = useRef(false);

  // TODO: we should handle this better...
  // Store the validation error handler in a ref to avoid triggering useEffect reruns
  const validationErrorHandler = useCallback((fieldName: FieldName, errors: readonly string[]) => {
    console.warn(`Validation error in ${fieldName}:`, errors);
    if (errors.length > 0) {
      // Don't update state for every validation error, only log them
      // setFormError(`${fieldName}: ${errors[0]}`);
    }
  }, []);

  // Store the tokenize error handler in a ref to avoid triggering useEffect reruns
  const tokenizeErrorHandler = useCallback(
    (error: unknown) => {
      console.error("Tokenization error:", error);
      setFormError(typeof error === "string" ? error : "An error occurred during tokenization");
      onError?.(error);
    },
    [onError],
  );

  useEffect(() => {
    // Only initialize once
    if (formInitializedRef.current) return;

    let cleanup: (() => void) | undefined;

    const setupForm = async () => {
      if (!formContainerRef.current) return;

      try {
        setIsLoading(true);
        setFormError(null);

        // Ensure the container has an ID
        if (formContainerRef.current && !formContainerRef.current.id) {
          formContainerRef.current.id = `finix-form-${Math.random().toString(36).substring(2, 9)}`;
        }

        // Create environment config
        const envConfig: EnvironmentConfig = {
          environment: FINIX_ENVIRONMENT.SANDBOX,
          applicationId,
          merchantId,
          enableFraudDetection,
        };

        // Create form config
        const formConfig: FormConfig<"card", true> = {
          paymentType: "card",
          showAddress,
          showLabels,
          callbacks: {
            onLoad: () => {
              console.log("Form loaded");
              setIsLoading(false);
            },
            onUpdate: (state: FormState<"card", true>) => {
              console.log("Form updated:", state);
            },
            onTokenize: (token: string) => {
              console.log("Token received");
              onTokenize?.(token);
            },
            onTokenizeError: tokenizeErrorHandler,
            onValidationError: validationErrorHandler,
          },
        };

        // Initialize and render the form
        const creator = new PaymentFormCreator(envConfig);
        await creator.renderForm(formContainerRef.current.id, formConfig);

        formInitializedRef.current = true;

        // TODO: we still need to implement our cleanup function
        // Cleanup function
        cleanup = () => {
          console.log("Cleaning up form");
          formInitializedRef.current = false;
        };
      } catch (error: unknown) {
        console.error("Failed to initialize form:", error);
        setFormError(error instanceof Error ? error.message : "An unknown error occurred");
        setIsLoading(false);
        onError?.(error);
      }
    };

    setupForm();

    return () => {
      if (cleanup) cleanup();
    };
  }, [applicationId, merchantId, enableFraudDetection, showAddress, showLabels, onTokenize, validationErrorHandler, tokenizeErrorHandler]);

  return {
    formContainerRef,
    isLoading,
    formError,
  };
}
