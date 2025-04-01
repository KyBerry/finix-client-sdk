import { Environment, InitializationStatus, FormOptions, FormId, PaymentType, TokenId, FieldName, FormState, FieldOptions, FormError } from "./types";
import { createBrandedId, generateTimestampedId } from "../utils/uuid";
import { FraudDetection } from "./fraud-detection";
import { IframeManager } from "./iframe-manager";
import { TokenizationService } from "./tokenization";
import { createFormReducer, RootAction } from "../state/reducers/rootReducer";
import { Store } from "../state/store";
import { updateField, focusField, blurField } from "../state/actions/fieldActions";
import { submitForm, submitFormSuccess, submitFormError, resetForm } from "../state/actions/formActions";
import { updateBinInformation } from "../state/actions/binInfoActions";
import { detectCardBrand } from "./validators";

/**
 * Main entry point for the Finix SDK
 * Handles form creation, state management, and secure payment processing
 */
export class Finix {
  private readonly merchantId: string;
  private readonly environment: Environment.Type;
  private status: InitializationStatus = InitializationStatus.NOT_STARTED;
  private initPromise: Promise<void> | null = null;

  /**
   * Create a new Finix SDK instance
   * @param merchantId Merchant identifier
   * @param environment Finix environment
   */
  constructor(merchantId: string, environment: Environment.Type = Environment.Type.SANDBOX) {
    this.merchantId = merchantId;
    this.environment = environment;
    this.initPromise = this.initialize();
  }

  /**
   * Initialize the SDK
   * @returns A promise that resolves when initialization is complete
   */
  private async initialize(): Promise<void> {
    try {
      this.status = InitializationStatus.INITIALIZING;

      // Create a fraud session
      await FraudDetection.setup(this.merchantId, this.environment);

      // Mark initialization as complete
      this.status = InitializationStatus.READY;
    } catch (error) {
      console.error("Failed to initialize Finix SDK:", error);
      this.status = InitializationStatus.FAILED;
      throw error;
    }
  }

  /**
   * Create a card token form
   * @param elementId HTML element ID to mount the form
   * @param options Form options
   * @returns A payment form instance
   */
  public CardTokenForm(elementId: string, options: FormOptions): PaymentForm {
    return this.createForm("card", elementId, options);
  }

  /**
   * Create a bank token form
   * @param elementId HTML element ID to mount the form
   * @param options Form options
   * @returns A payment form instance
   */
  public BankTokenForm(elementId: string, options: FormOptions): PaymentForm {
    return this.createForm("bankAccount", elementId, options);
  }

  /**
   * Create a payment form
   * @param paymentType Type of payment form
   * @param elementId HTML element ID to mount the form
   * @param options Form options
   * @returns A payment form instance
   */
  private createForm(paymentType: PaymentType, elementId: string, options: FormOptions): PaymentForm {
    // Ensure the SDK is initialized
    if (this.status !== InitializationStatus.READY && !this.initPromise) {
      throw new Error("Finix SDK not initialized");
    }

    // Create a form ID
    const formId = createBrandedId<FormId>(generateTimestampedId(`form-${paymentType}-`));

    // Create a PaymentForm instance
    return new PaymentForm(formId, paymentType, elementId, options);
  }
}

/**
 * Represents a payment form (card or bank account)
 * Manages state, iframe communication, and tokenization
 */
class PaymentForm {
  private readonly formId: FormId;
  private readonly paymentType: PaymentType;
  private readonly elementId: string;
  private readonly options: FormOptions;
  private readonly iframeManager: IframeManager;
  private readonly store: Store<FormState, RootAction>;
  private onSubmitHandler?: () => void;
  private unsubscribeListener?: () => void;

  /**
   * Create a new payment form
   * @param formId Form identifier
   * @param paymentType Type of payment form
   * @param elementId HTML element ID to mount the form
   * @param environment Finix environment
   * @param sessionKey Session key for fraud detection
   * @param options Form options
   */
  constructor(formId: FormId, paymentType: PaymentType, elementId: string, options: FormOptions) {
    this.formId = formId;
    this.paymentType = paymentType;
    this.elementId = elementId;

    // Set up options with defaults
    this.options = {
      environment: options.environment,
      applicationId: options.applicationId || "",
      showLabels: options.showLabels !== false,
      showPlaceholders: options.showPlaceholders !== false,
      showAddress: options.showAddress || false,
      hideFields: options.hideFields || [],
      sessionKey: options.sessionKey,
      styles: options.styles || {},
      fonts: options.fonts || [],
      onReady: options.onReady,
      onUpdate: options.onUpdate,
      onSubmit: options.onSubmit,
      submitLabel: options.submitLabel || "Submit",
    };

    // Create the iframe manager
    this.iframeManager = new IframeManager(formId, paymentType, this.options.environment);

    // Create the tokenization service
    const tokenizationService = new TokenizationService(this.options.applicationId, this.options.environment, this.options.sessionKey);

    // Create the store
    const formReducer = createFormReducer(formId, paymentType, this.options);

    this.store = new Store<FormState, RootAction>(undefined, formReducer, {
      enableTimeTravel: false,
      errorHandler: (error, phase, context) => {
        console.error(`Error in ${phase} phase:`, error, context);
      },
    });

    // Set up message listeners
    this.setupMessageListeners();

    // Render the form
    this.renderForm();
  }

  /**
   * Set up message listeners for iframe communication
   */
  private setupMessageListeners(): void {
    this.unsubscribeListener = this.iframeManager.setupMessageListener((message) => {
      if (message.messageName === "field-updated") {
        const { name, state } = message.messageData as any;

        // Update field state
        this.store.dispatch(updateField(this.formId, name as FieldName, state.value || ""));

        // Handle BIN detection for card forms
        if (this.paymentType === "card" && name === "number" && state.value) {
          const cardBrand = detectCardBrand(state.value);
          this.store.dispatch(
            updateBinInformation(this.formId, {
              bin: state.value.slice(0, 6),
              cardBrand,
            }),
          );
        }
      } else if (message.messageName === "form-submit") {
        // Handle form submission
        if (this.onSubmitHandler) {
          this.onSubmitHandler();
        }
      } else if (message.messageName === "bin-information-received") {
        // Handle BIN information
        this.store.dispatch(updateBinInformation(this.formId, message.messageData as any));
      }
    });
  }

  /**
   * Render the form in the DOM
   */
  private renderForm(): void {
    // Get the container element
    const container = document.getElementById(this.elementId);
    if (!container) {
      throw new Error(`Element with ID "${this.elementId}" not found`);
    }

    // Clear the container
    container.innerHTML = "";

    // TODO: Implement form rendering based on payment type
    // This would create all the necessary field iframes and UI elements
  }

  /**
   * Create a field iframe and add it to the form
   * @param fieldType Type of field
   * @param options Field options
   * @returns The created iframe
   */
  public field(fieldType: string, options: FieldOptions): HTMLIFrameElement {
    const iframe = this.iframeManager.createFieldIframe(fieldType, options);
    return iframe;
  }

  /**
   * Set a submission handler for the form
   * @param handler Function to call when the form is submitted
   */
  public onSubmit(handler: () => void): void {
    this.onSubmitHandler = handler;
  }

  /**
   * Submit the form with additional data
   * @param environment Finix environment
   * @param applicationId Application ID
   * @param data Additional data to submit
   * @param callback Callback function for submission result
   */
  public submitWithData(environment: Environment.Type, applicationId: string, data: Record<string, unknown> = {}, callback: (error: FormError | null, response?: { id: string }) => void): void {
    // Dispatch submission action
    this.store.dispatch(submitForm(this.formId));

    // Submit the form data
    this.iframeManager
      .submitWithData(environment, applicationId, data)
      .then((response) => {
        // Handle success
        const tokenId = createBrandedId<TokenId>(response.id);
        this.store.dispatch(submitFormSuccess(this.formId, tokenId));
        callback(null, response);
      })
      .catch((error) => {
        // Handle error
        const formattedError: FormError = {
          code: error.code || "UNKNOWN_ERROR",
          message: error.message || "An unknown error occurred",
          details: error,
        };
        this.store.dispatch(submitFormError(this.formId, [formattedError]));
        callback(formattedError);
      });
  }

  /**
   * Submit the form with application ID
   * @param environment Finix environment
   * @param applicationId Application ID
   * @param callback Callback function for submission result
   */
  public submit(environment: Environment.Type, applicationId: string, callback: (error: FormError | null, response?: { id: string }) => void): void {
    // Validate required parameters
    if (!environment) {
      console.error("submit() - No environment was provided");
      return;
    }

    if (!applicationId) {
      console.error("submit() - No applicationId was provided");
      return;
    }

    // Submit the form
    this.submitWithData(environment, applicationId, {}, callback);
  }

  /**
   * Reset the form state
   */
  public reset(): void {
    this.store.dispatch(resetForm(this.formId));
  }

  /**
   * Clean up resources when the form is no longer needed
   */
  public destroy(): void {
    // Remove message listeners
    if (this.unsubscribeListener) {
      this.unsubscribeListener();
    }

    // Clean up iframe manager
    this.iframeManager.destroy();
  }
}
