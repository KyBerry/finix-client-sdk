import { FraudDetection } from "@/services";
// Import the concrete product classes
import { BankPaymentForm } from "@/products/bank-payment-form";
import { CardPaymentForm } from "@/products/card-payment-form";
import { TokenPaymentForm } from "@/products/token-payment-form";

// Use FormConfig from @/types
import type { FormType, FormConfig, EnvironmentConfig } from "@/types";

/**
 * Concrete creator class for payment forms (Factory Method pattern)
 */
export class PaymentFormCreator {
  // Type is now directly EnvironmentConfig, as fraudSessionId is mutable
  protected environment: EnvironmentConfig;
  protected fraudInitialized: boolean = false; // Track initialization

  constructor(environment: EnvironmentConfig) {
    // --- Input Validation ---
    if (!environment) {
      throw new Error("PaymentFormCreator Error: EnvironmentConfig is required.");
    }
    if (!environment.applicationId || typeof environment.applicationId !== "string") {
      throw new Error("PaymentFormCreator Error: EnvironmentConfig requires a valid applicationId (string).");
    }
    if (!environment.merchantId || typeof environment.merchantId !== "string") {
      throw new Error("PaymentFormCreator Error: EnvironmentConfig requires a valid merchantId (string).");
    }
    if (!environment.environment || typeof environment.environment !== "string") {
      // Also check environment itself
      throw new Error("PaymentFormCreator Error: EnvironmentConfig requires a valid environment (string).");
    }

    // Optional: Warn if format looks incorrect (basic check)
    if (!environment.applicationId.startsWith("AP")) {
      console.warn("PaymentFormCreator Warning: applicationId does not start with 'AP'. Ensure it is correct.");
    }
    // --- End Input Validation ---

    // Clone to prevent external mutation. Type is now correctly EnvironmentConfig.
    this.environment = { ...environment };
  }

  private async initializeFraudDetection(): Promise<void> {
    if (this.fraudInitialized) {
      return; // Explicit return for this path
    }
    if (this.environment.enableFraudDetection !== false && !this.environment.fraudSessionId) {
      try {
        const sessionId = await FraudDetection.setup(this.environment.merchantId, this.environment.environment);
        this.environment.fraudSessionId = sessionId;
        this.fraudInitialized = true;
      } catch (error) {
        console.warn("Failed to initialize fraud detection: ", error);
        this.fraudInitialized = false;
        // Implicit return undefined here
      }
    } else {
      this.fraudInitialized = true;
      // Implicit return undefined here
    }
    // Ensure all paths are covered - return explicitly if needed, though implicit undefined is fine for Promise<void>
  }

  // --- createForm Overloads ---
  createForm(config: FormConfig<"bank">): BankPaymentForm;
  createForm(config: FormConfig<"card">): CardPaymentForm;
  createForm(config: FormConfig<"token">): TokenPaymentForm;
  /**
   * Factory method for creating payment forms
   */
  createForm<T extends FormType>(config: FormConfig<T>): BankPaymentForm | CardPaymentForm | TokenPaymentForm {
    if (!this.fraudInitialized) {
      console.warn("Fraud detection not initialized before creating form. Session ID might be missing.");
    }

    switch (config.paymentType) {
      case "bank":
        return new BankPaymentForm(this.environment, config as FormConfig<"bank">);
      case "card":
        return new CardPaymentForm(this.environment, config as FormConfig<"card">);
      case "token":
        return new TokenPaymentForm(this.environment, config as FormConfig<"token">);
      default:
        const exhaustiveCheck: never = config.paymentType;
        throw new Error(`Unsupported payment form type: ${exhaustiveCheck}`);
    }
  }

  /**
   * Template method to render a form in a container
   */
  // --- renderForm Overloads ---
  async renderForm(containerId: string, config: FormConfig<"bank">): Promise<void>;
  async renderForm(containerId: string, config: FormConfig<"card">): Promise<void>;
  async renderForm(containerId: string, config: FormConfig<"token">): Promise<void>;
  async renderForm<T extends FormType>(containerId: string, config: FormConfig<T>): Promise<void> {
    await this.initializeFraudDetection();

    const form = this.createForm(config as any);

    form.render(containerId);
  }
}
