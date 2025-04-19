import { FinixTokenResponse, FormId } from "@/types";
import { createBrandedId, generateTimestampedId } from "@/utils";

import type { EnvironmentConfig, FieldName, FieldState, FormConfig, FormState, FormType, IframeMessage } from "@/interfaces/types";

export abstract class BasePaymentForm<TFormType extends FormType = FormType> {
  protected readonly formId: string;
  protected readonly environment: EnvironmentConfig;
  protected readonly config: FormConfig<TFormType>;

  private messageHandlers: Array<(event: MessageEvent) => void> = [];

  constructor(environment: EnvironmentConfig, config: FormConfig<TFormType>) {
    this.environment = environment;
    this.config = config;
    this.formId = createBrandedId<FormId>(generateTimestampedId(`form-`));
  }

  // TODO: I think we need to check if the window object is available?
  render(containerId: string): void {
    // Pre-rendering logic
    this.cleanupMessageListeners();

    // Get DOM container
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear previous content
    container.innerHTML = "";

    // Let subclasses add their specific elements
    this.addFormHeader(container);
    this.renderFormFields(container);
    this.addSubmitButton(container);

    // Set up message listener with the handler from concrete implementation
    this.setupMessageListener(this.handleMessage.bind(this));
  }

  /**
   * Set up a message listener for iframe communication
   * @param callback Function to call when a message is received
   * @returns A cleanup function to remove the listener
   */
  private setupMessageListener(callback: (message: IframeMessage) => void): (() => void) | undefined {
    if (typeof window === "undefined") return;

    const handler = (event: MessageEvent): void => {
      // Validate the message origin
      if (!this.isValidOrigin(event.origin)) return;

      // Ensure the message is for this form
      const message = event.data as IframeMessage;
      if (message && message.formId === this.formId) {
        callback(message);
      }
    };

    // Add the handler to our tracking array
    this.messageHandlers.push(handler);

    // Add the event listener
    window.addEventListener("message", handler);

    // Return a cleanup function
    return () => {
      window.removeEventListener("message", handler);
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
    };
  }

  protected cleanupMessageListeners(): void {
    this.messageHandlers.forEach((handler) => {
      window.removeEventListener("message", handler);
    });

    this.messageHandlers = [];
  }

  /**
   * Validate that a message origin is from our expected domain
   * @param origin The origin to validate
   * @returns Whether the origin is valid
   */
  private isValidOrigin(origin: string): boolean {
    // Check if the origin is one of our allowed domains
    const allowedDomains = ["https://js.finix.com"];

    return allowedDomains.some((domain) => origin.startsWith(domain));
  }

  abstract getFormState(): FormState;
  abstract setFormState(fieldName: FieldName, state: FieldState): void;
  abstract submit(): Promise<FinixTokenResponse>;

  /**
   * Update submit button state based on form validation
   */
  protected abstract updateSubmitButtonState(): void;

  /**
   * Initialize form fields
   */
  protected abstract initializeFields(): void;

  /**
   * Initialize form state
   */
  protected abstract initializeFormState(): void;

  protected abstract addFormHeader(form: HTMLElement): void;
  protected abstract renderFormFields(form: HTMLElement): void;
  protected abstract addSubmitButton(form: HTMLElement): void;
  protected abstract handleMessage(message: IframeMessage): void;
}
