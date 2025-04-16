import { FraudDetection } from "./fraud-detection";
import { IframeManager } from "./iframe-manager";
import { createFormReducer, RootAction } from "../state/reducers/rootReducer";
import { Store } from "../state/store";
import { updateField } from "../state/actions/fieldActions";
import { submitForm, submitFormSuccess, submitFormError } from "../state/actions/formActions";
import { updateBinInformation } from "../state/actions/binInfoActions";

import { DEFAULT_PRESETS } from "@/presets";
import { FINIX_ENVIRONMENT, INIT_STATUS } from "@/types";
import { createBrandedId, deepMerge, generateTimestampedId } from "@/utils";

import type { DefaultPresets, FinixConfigOptions, FinixFormFieldName, FinixTokenFormOptions, FormId } from "@/types";

/**
 * Main entry point for the Finix SDK
 * Handles form creation, state management, and secure payment processing
 */
export class Finix {
  private sessionId: string | null = null;
  private initPromise: Promise<void> | null = null;
  private status: INIT_STATUS = INIT_STATUS.NOT_STARTED;
  private readonly finixConfigOptions: FinixConfigOptions;

  /**
   * Create a new Finix SDK instance
   * @param merchantId Merchant identifier
   * @param environment Finix environment
   */
  constructor({ applicationId, environment = FINIX_ENVIRONMENT.SANDBOX, merchantId }: FinixConfigOptions) {
    this.finixConfigOptions = {
      applicationId,
      environment,
      merchantId,
    };

    this.initPromise = this.initialize();
  }

  /**
   * Initialize the SDK
   * @returns A promise that resolves when initialization is complete
   */
  private async initialize(): Promise<void> {
    try {
      this.status = INIT_STATUS.INITIALIZING;

      const { merchantId, environment } = this.finixConfigOptions;

      // Create a fraud session
      this.sessionId = await FraudDetection.setup(merchantId, environment);

      // Mark initialization as complete
      this.status = INIT_STATUS.READY;
    } catch (error) {
      console.error("Failed to initialize Finix SDK:", error);
      this.status = INIT_STATUS.FAILED;
      throw error;
    }
  }

  private async createForm(type: "card" | "bank" | "token", options: { preset?: DefaultPresets; customOptions: Partial<FinixTokenFormOptions> }) {
    const { preset = "base", customOptions } = options;

    // Ensure SDK is initialized
    if (this.initPromise) await this.initPromise;

    if (this.status !== INIT_STATUS.READY || !this.sessionId) {
      throw new Error("Finix SDK not initialized");
    }

    const formId = createBrandedId<FormId>(generateTimestampedId(`form-${type}-`));
    const formOptions = deepMerge(DEFAULT_PRESETS[preset], customOptions);
  }

  private async createFieldHolder(fieldName: FinixFormFieldName, formOptions: Partial<FinixTokenFormOptions>) {
    const fieldHolderEl = document.createElement("div");
    fieldHolderEl.classList.add("field-holder", fieldName);

    if (formOptions.showLabels && formOptions.labels && formOptions.labels[fieldName]) {
      const labelEl = document.createElement("label");
      labelEl.innerText = formOptions.labels[fieldName];

      fieldHolderEl.appendChild(labelEl);
    }
  }

  // /**
  //  * Create a card token form
  //  * @param elementId HTML element ID to mount the form
  //  * @param options Form options
  //  * @returns A payment form instance
  //  */
  // public async CardTokenForm(elementId: string, options: FormOptions): Promise<PaymentForm> {
  //   return await this.createForm("card", elementId, options);
  // }

  // /**
  //  * Create a bank token form
  //  * @param elementId HTML element ID to mount the form
  //  * @param options Form options
  //  * @returns A payment form instance
  //  */
  // public async BankTokenForm(elementId: string, options: FormOptions): Promise<PaymentForm> {
  //   return await this.createForm("bankAccount", elementId, options);
  // }

  // /**
  //  * Create a payment form
  //  * @param paymentType Type of payment form
  //  * @param elementId HTML element ID to mount the form
  //  * @param options Form options
  //  * @returns A payment form instance
  //  */
  // private async createForm(paymentType: PaymentType, elementId: string, options: FormOptions): Promise<PaymentForm> {
  //   if (this.initPromise) {
  //     await this.initPromise;
  //   }

  //   // Ensure the SDK is initialized
  //   if (this.status !== INIT_STATUS.READY || !this.sessionId) {
  //     throw new Error("Finix SDK not initialized");
  //   }

  //   // Create a form ID
  //   const formId = createBrandedId<FormId>(generateTimestampedId(`form-${paymentType}-`));

  //   console.log("FORM_ID: ", formId);

  //   // Create a PaymentForm instance
  //   return new PaymentForm(formId, paymentType, elementId, this.sessionId, options);
  // }
}

// /**
//  * Represents a payment form (card or bank account)
//  * Manages state, iframe communication, and tokenization
//  */
// class PaymentForm {
//   private readonly formId: FormId;
//   private readonly paymentType: PaymentType;
//   private readonly elementId: string;
//   private readonly sessionId: string;
//   private readonly options: FormOptions;
//   private readonly iframeManager: IframeManager;
//   private readonly store: Store<FormState, RootAction>;
//   private onSubmitHandler?: () => void;
//   private unsubscribeListener?: () => void;

//   /**
//    * Create a new payment form
//    * @param formId Form identifier
//    * @param paymentType Type of payment form
//    * @param elementId HTML element ID to mount the form
//    * @param environment Finix environment
//    * @param sessionKey Session key for fraud detection
//    * @param options Form options
//    */
//   constructor(formId: FormId, paymentType: PaymentType, elementId: string, sessionId: string, options: FormOptions) {
//     this.formId = formId;
//     this.paymentType = paymentType;
//     this.elementId = elementId;
//     this.sessionId = sessionId;

//     // Set up options with defaults
//     this.options = {
//       environment: options.environment,
//       applicationId: options.applicationId || "",
//       showLabels: options.showLabels !== false,
//       showPlaceholders: options.showPlaceholders !== false,
//       showAddress: options.showAddress || false,
//       hideFields: options.hideFields || [],
//       styles: options.styles || {},
//       fonts: options.fonts || [],
//       onReady: options.onReady,
//       onUpdate: options.onUpdate,
//       onSubmit: options.onSubmit,
//       submitLabel: options.submitLabel || "Submit",
//     };

//     // Create the iframe manager
//     this.iframeManager = new IframeManager(formId, paymentType, this.options.environment);

//     // Create the store
//     const formReducer = createFormReducer(formId, paymentType, this.options);

//     this.store = new Store<FormState, RootAction>(undefined, formReducer, {
//       enableTimeTravel: false,
//       errorHandler: (error, phase, context) => {
//         console.error(`Error in ${phase} phase:`, error, context);
//       },
//     });

//     // Set up message listeners
//     this.setupMessageListeners();

//     // Render the form
//     this.renderForm();
//   }

//   /**
//    * Set up message listeners for iframe communication
//    */
//   private setupMessageListeners(): void {
//     console.log("I ran setup message listeners");
//     this.unsubscribeListener = this.iframeManager.setupMessageListener((message) => {
//       if (message.messageName === "field-updated") {
//         const { name, state } = message.messageData as FormField;
//         // Update field state
//         this.store.dispatch(updateField(this.formId, name, state));
//       } else if (message.messageName === "form-submit") {
//         // Handle form submission
//         if (this.onSubmitHandler) {
//           this.onSubmitHandler();
//         }
//       } else if (message.messageName === "bin-information-received") {
//         // Handle BIN information
//         this.store.dispatch(updateBinInformation(this.formId, message.messageData as any));
//       }
//     });
//   }

//   /**
//    * Render the form in the DOM
//    */
//   private renderForm(): void {
//     // Get the container element
//     const formEl = document.getElementById(this.elementId);

//     if (!formEl) {
//       throw new Error(`Element with ID "${this.elementId}" not found`);
//     }

//     const containerEl = document.createElement("div");
//     containerEl.id = "finix-form-container";
//     containerEl.classList.add("finix-form-container");

//     formEl.appendChild(containerEl);

//     // TODO: Implement form rendering based on payment type
//     // This would create all the necessary field iframes and UI elements
//   }

//   private renderCardForm(formId: string): void {}

//   private renderBankForm(formId: string): void {}

//   private renderCardFields(): void {
//     this.iframeManager.createFieldIframe("");
//   }

//   private renderBankFields(): void {}

//   private renderAddressFields(): void {}

//   /**
//    * Create a field iframe and add it to the form
//    * @param fieldType Type of field
//    * @param options Field options
//    * @returns The created iframe
//    */
//   public field(fieldType: string, options: FieldOptions): HTMLIFrameElement {
//     const iframe = this.iframeManager.createFieldIframe(fieldType, options);
//     return iframe;
//   }

//   /**
//    * Set a submission handler for the form
//    * @param handler Function to call when the form is submitted
//    */
//   public onSubmit(handler: () => void): void {
//     this.onSubmitHandler = handler;
//   }

//   /**
//    * Submit the form with additional data
//    * @param environment Finix environment
//    * @param applicationId Application ID
//    * @param data Additional data to submit
//    * @param callback Callback function for submission result
//    */
//   public submitWithData(environment: Environment.Type, applicationId: string, data: Record<string, unknown> = {}, callback: (error: FormError | null, response?: { id: string }) => void): void {
//     // Dispatch submission action
//     this.store.dispatch(submitForm(this.formId));

//     // Submit the form data through the iframe manager
//     this.iframeManager
//       .submitWithData(environment, applicationId, this.sessionId, data)
//       .then((response) => {
//         // Handle success
//         const tokenId = createBrandedId<TokenId>(response.id);
//         this.store.dispatch(submitFormSuccess(this.formId, tokenId));
//         callback(null, response);
//       })
//       .catch((error) => {
//         // Handle error
//         const formattedError: FormError = {
//           code: error.code || "UNKNOWN_ERROR",
//           message: error.message || "An unknown error occurred",
//           details: error,
//         };
//         this.store.dispatch(submitFormError(this.formId, [formattedError]));
//         callback(formattedError);
//       });
//   }

//   /**
//    * Submit the form with application ID
//    * @param environment Finix environment
//    * @param applicationId Application ID
//    * @param callback Callback function for submission result
//    */
//   public submit(environment: FINIX_ENVIRONMENT, applicationId: string, callback: (error: FormError | null, response?: { id: string }) => void): void {
//     // Validate required parameters
//     if (!environment) {
//       console.error("submit() - No environment was provided");
//       return;
//     }

//     if (!applicationId) {
//       console.error("submit() - No applicationId was provided");
//       return;
//     }

//     // Submit the form with empty additional data
//     this.submitWithData(environment, applicationId, {}, callback);
//   }

//   /**
//    * Clean up resources when the form is no longer needed
//    */
//   public destroy(): void {
//     // Remove message listeners
//     if (this.unsubscribeListener) {
//       this.unsubscribeListener();
//     }

//     // Clean up iframe manager
//     this.iframeManager.destroy();
//   }
// }
