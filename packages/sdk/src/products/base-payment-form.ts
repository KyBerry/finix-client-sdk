import { createBrandedId, generateTimestampedId } from "@/utils";

import { DEFAULT_ADDRESS_FIELD_STATE, DEFAULT_BANK_FIELD_STATE, DEFAULT_CARD_FIELD_STATE, DEFAULT_TOKEN_FIELD_STATE } from "@/constants";

import { getVisibleFields } from "@/types";
import type { AddressFieldName, AvailableFieldNames, BankFieldName, CardFieldName, FinixTokenResponse, FormId, EnvironmentConfig, FieldName, FieldState, FormConfig, FormState, FormType, IframeMessage, MessageType } from "@/types";

// Define structure for stored promise handlers
interface SubmissionPromise {
  resolve: (value: FinixTokenResponse | PromiseLike<FinixTokenResponse>) => void;
  reject: (reason?: Error) => void;
}

export abstract class BasePaymentForm<TFormType extends FormType = FormType> {
  protected readonly formId: FormId;
  protected readonly environment: EnvironmentConfig;
  protected readonly config: FormConfig<TFormType>;
  protected formState: FormState<TFormType, boolean> = {};
  protected binInformation: Record<string, unknown> = {};
  protected fields: HTMLIFrameElement[] = [];
  protected messageHandlers: Array<(event: MessageEvent) => void> = [];
  protected submissionPromises: Map<string, SubmissionPromise> = new Map();

  constructor(environment: EnvironmentConfig, config: FormConfig<TFormType>) {
    this.environment = environment;
    this.config = config;
    this.formId = createBrandedId<FormId>(generateTimestampedId(`form-`));

    // Initialize form state and fields
    this.initializeFormState();
  }

  // TODO: I think we need to check if the window object is available?
  render(containerId: string): void {
    // Pre-rendering logic
    this.cleanupMessageListeners();
    this._injectBaseStyles();

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

    // Invoke onLoad callback after setup
    this.config.callbacks?.onLoad?.();
  }

  /**
   * Initializes the form state based on the form's payment type.
   */
  protected initializeFormState(): void {
    // Determine the correct base default state based on form type
    let baseDefaultState: Partial<Record<FieldName, FieldState>>;
    switch (this.config.paymentType) {
      case "card":
        baseDefaultState = DEFAULT_CARD_FIELD_STATE;
        break;
      case "bank":
        baseDefaultState = DEFAULT_BANK_FIELD_STATE;
        break;
      case "token":
        // For TokenForm initial load, default to card state.
        // The override in TokenPaymentForm handles subsequent toggles.
        baseDefaultState = DEFAULT_CARD_FIELD_STATE;
        break;
      default:
        baseDefaultState = {}; // Should not happen
    }

    // Include default address state if showAddress is true
    const showAddress = !!this.config.showAddress;
    const fullDefaultState: Partial<Record<FieldName, FieldState>> = showAddress ? { ...baseDefaultState, ...DEFAULT_ADDRESS_FIELD_STATE } : baseDefaultState;

    // Get the fields that should be visible based on config (hideFields, showAddress)
    // Use the form's actual payment type here.
    const visibleFields = getVisibleFields({
      paymentType: this.config.paymentType,
      hideFields: this.config.hideFields,
      showAddress: showAddress,
    });
    const visibleFieldsSet = new Set<AvailableFieldNames<TFormType, boolean>>(visibleFields);

    // Filter the full default state to include only visible fields
    const initialVisibleState: FormState<TFormType, boolean> = {};
    for (const field of visibleFieldsSet) {
      // Assert field is a key of fullDefaultState, although visibleFields should guarantee this
      const typedField = field as keyof typeof fullDefaultState;
      if (fullDefaultState[typedField]) {
        const defaultStateForField = fullDefaultState[typedField];
        const stateFieldKey = field as keyof FormState<TFormType, boolean>;
        initialVisibleState[stateFieldKey] = {
          ...defaultStateForField,
          errorMessages: [...defaultStateForField.errorMessages],
        };
      } else {
        // If somehow a visible field doesn't have a default, provide a basic one
        // This case should be rare with comprehensive default constants
        // Assert field is a valid key for initialVisibleState
        const stateFieldKey = field as keyof FormState<TFormType, boolean>;
        initialVisibleState[stateFieldKey] = {
          isDirty: false,
          isFocused: false,
          errorMessages: [],
        };
      }
    }

    // Apply default values from config, overriding the defaults from constants
    if (this.config.defaultValues) {
      for (const [field, value] of Object.entries(this.config.defaultValues)) {
        const typedField = field as keyof FormState<TFormType, boolean>;
        // Ensure the field exists in our initialized state before applying default
        if (initialVisibleState[typedField]) {
          // Check if value is a string before assigning (as it comes from Object.entries as unknown)
          if (typeof value === "string") {
            initialVisibleState[typedField].selected = value;
          }
        }
      }
    }

    // Set the final initialized state
    this.formState = initialVisibleState;
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

  /**
   * Calculates the overall validity of the form based on current state.
   * @returns True if all fields are valid (no error messages), false otherwise.
   */
  protected _checkFormValidity(): boolean {
    for (const fieldName in this.formState) {
      if (Object.prototype.hasOwnProperty.call(this.formState, fieldName)) {
        const fieldState = this.formState[fieldName as keyof typeof this.formState];
        if (fieldState?.errorMessages && fieldState.errorMessages.length > 0) {
          return false; // Found a field with errors
        }
      }
    }
    return true; // No errors found
  }

  /**
   * Handles incoming messages from the iframes.
   * Parses message, updates state, checks validity, and triggers callbacks.
   * @param message The message object received from an iframe.
   */
  protected handleMessage(message: IframeMessage): void {
    const { messageName, messageData, messageId } = message;

    // Type guard for messageData based on messageName
    const isFieldUpdateData = (data: unknown): data is { name: FieldName; state: FieldState } => {
      // Use type assertion or more careful checks if needed after 'unknown'
      return typeof data === "object" && data !== null && "name" in data && typeof data.name === "string" && "state" in data && typeof data.state === "object";
    };

    const isBinInfoData = (data: unknown): data is Record<string, unknown> => {
      // Add more specific checks if the structure is known
      return typeof data === "object" && data !== null;
    };

    switch (messageName) {
      case "field-updated":
        if (isFieldUpdateData(messageData)) {
          const { name: fieldName, state: newFieldState } = messageData;
          // Update the state mirror
          this.setFormState(fieldName, newFieldState);

          // --- Update Validation Message in DOM ---
          const validationElementId = `${this.formId}-${fieldName}-validation`;
          const validationElement = document.getElementById(validationElementId);
          if (validationElement) {
            validationElement.textContent = newFieldState.errorMessages?.[0] || ""; // Display first error or clear
          } else {
            console.warn(`Validation element not found: ${validationElementId}`);
          }
          // --- End Update ---

          // --- Handle Country Change for Dynamic Fields ---
          if (fieldName === "address_country") {
            const newCountry = newFieldState.selected || ""; // Assuming selected holds the country code
            this._handleCountryChange(newCountry.toUpperCase()); // Normalize to uppercase
          }
          // --- End Country Change Handling ---

          // Re-calculate overall form validity
          const isFormValid = this._checkFormValidity();

          // Update submit button state (implementation is in concrete class)
          this.updateSubmitButtonState(isFormValid);

          // Trigger callbacks
          this.config.callbacks?.onUpdate?.(this.formState as FormState, this.binInformation, !isFormValid);
          if (newFieldState.errorMessages?.length > 0) {
            this.config.callbacks?.onValidationError?.(fieldName, newFieldState.errorMessages);
          }
        } else {
          console.warn("Received field-updated message with invalid data:", messageData);
        }
        break;

      case "bin-information-received":
        if (isBinInfoData(messageData)) {
          this.binInformation = messageData;
          const isFormValid = this._checkFormValidity();
          this.config.callbacks?.onUpdate?.(this.formState as FormState, this.binInformation, !isFormValid);
        } else {
          console.warn("Received bin-information-received message with invalid data:", messageData);
        }
        break;

      // --- Handle Submission Responses ---
      case "response-received":
      case "response-error":
        if (messageId && this.submissionPromises.has(messageId)) {
          const promiseHandlers = this.submissionPromises.get(messageId)!;
          if (messageName === "response-received") {
            // Assume messageData conforms to FinixTokenResponse structure
            promiseHandlers.resolve(messageData as FinixTokenResponse);
            // Extract token ID if possible for onTokenize callback
            const tokenId = (messageData as FinixTokenResponse)?.data?.id;
            if (tokenId) {
              this.config.callbacks?.onTokenize?.(tokenId);
            }
          } else {
            // messageName === "response-error"
            console.error("Finix Form Error:", messageData);
            // Create an Error object for rejection
            const error = new Error(`Iframe submission failed: ${JSON.stringify(messageData)}`);
            promiseHandlers.reject(error);
            // Pass the original error data to the callback
            this.config.callbacks?.onTokenizeError?.(messageData);
          }
          // Clean up the stored promise
          this.submissionPromises.delete(messageId);
        } else {
          console.warn(`Received ${messageName} for unknown/missing messageId: ${messageId}`);
        }
        break;

      // TODO: Add cases for 'form-submit' (if applicable)

      default:
        console.warn("Received unknown message type:", messageName);
    }
  }

  /**
   * Injects base CSS rules for form layout and elements if not already present.
   */
  protected _injectBaseStyles(): void {
    const styleId = "finix-sdk-base-styles";
    if (document.getElementById(styleId)) {
      return; // Styles already injected
    }

    const css = `
      /* Basic Wrapper Layout */
      .${this.formId}-field-wrapper {
        margin-bottom: 10px; /* Spacing between fields */
        width: 100%;
      }
      .${this.formId}-field-wrapper label {
        display: block;
        margin-bottom: 4px;
        font-size: 0.9em;
        /* Add other label styles as needed */
      }
      .${this.formId}-field-wrapper iframe {
        display: block; /* Ensure iframe takes block layout */
        width: 100%;
        /* height is set inline currently */
      }
      .${this.formId}-field-wrapper .validation-message {
        /* Styles set inline currently, can move here */
        min-height: 1.2em; /* Reserve space even when empty */
      }

      /* Submit Button Styling (basic) */
      #${this.formId}-submit-button:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
      }
      #${this.formId}-submit-button:hover:not(:disabled) {
        opacity: 0.9;
      }

      /* Token Form Toggle Button Styling (basic) */
      .finix-payment-type-toggle {
        display: flex;
        margin-bottom: 15px;
        gap: 10px;
      }
      .finix-payment-type-toggle .finix-button {
        padding: 8px 15px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background-color: #f0f0f0;
        cursor: pointer;
      }
      .finix-payment-type-toggle .finix-button.active {
        border-color: #007bff;
        background-color: #e7f3ff;
        font-weight: bold;
      }
      .finix-payment-type-toggle .finix-button:hover:not(.active) {
        background-color: #e0e0e0;
      }
    `;

    const styleElement = document.createElement("style");
    styleElement.id = styleId;
    styleElement.textContent = css.replace(/\s*\n\s*/g, " ").trim(); // Minify slightly

    document.head.appendChild(styleElement);
  }

  // --- Abstract Methods ---
  // Keep these abstract for now, concrete classes implement them
  protected abstract getFormState(): FormState;
  protected abstract setFormState(fieldName: FieldName, state: FieldState): void;
  protected abstract submit(): Promise<FinixTokenResponse>;
  protected abstract updateSubmitButtonState(isFormValid: boolean): void;
  protected abstract initializeFields(): void;
  protected abstract addFormHeader(form: HTMLElement): void;
  protected abstract renderFormFields(form: HTMLElement): void;
  protected abstract addSubmitButton(form: HTMLElement): void;
  protected abstract _handleCountryChange(country: string): void;
}
