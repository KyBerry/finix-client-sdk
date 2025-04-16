import { FraudDetection } from "@/services";

import type { PaymentForm, FormType, FormOptions, EnvironmentConfig } from "../interfaces/types";

/**
 * Abstract creator class for payment forms (Factory Method pattern)
 */
export abstract class BaseFormCreator<T extends FormType> {
  protected environment: EnvironmentConfig;

  constructor(environment: EnvironmentConfig) {
    this.environment = environment;
    this.initializeFraudDetection();
  }

  private async initializeFraudDetection(): Promise<void> {
    if (this.environment.enableFraudDetection !== false && !this.environment.fraudSessionId) {
      try {
        const sessionId = await FraudDetection.setup(this.environment.merchantId, this.environment.environment);
        this.environment.fraudSessionId = sessionId;
      } catch (error) {
        console.warn("Failed to initialize fraud detection: ", error);
      }
    }
  }

  /**
   * Factory method for creating payment forms
   * To be implemented by concrete creators
   */
  abstract createForm(options: FormOptions<T>): PaymentForm;

  /**
   * Template method to render a form in a container
   */
  renderForm(containerId: string, options: FormOptions<T>): void {
    const form = this.createForm(options);
    form.render(containerId);
  }
}
