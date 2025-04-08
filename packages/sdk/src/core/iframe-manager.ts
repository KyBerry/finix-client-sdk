import { Environment, FieldOptions, FormId, IframeMessage, MessageType, PAYMENT_INSTRUMENTS, PaymentType } from "./types";
import { cleanObject } from "../utils/object";

/**
 * Manages secure iframe communication and creation
 * This is a critical security component that ensures sensitive data
 * is handled only within isolated iframes.
 */
export class IframeManager {
  private readonly baseUrl: string;
  private readonly formId: FormId;
  private readonly paymentType: PaymentType;
  private readonly iframes: HTMLIFrameElement[] = [];
  private messageHandlers: Array<(event: MessageEvent) => void> = [];

  /**
   * Create a new iframe manager
   * @param formId The unique form identifier
   * @param paymentType The type of payment form (card or bankAccount)
   * @param environment The Finix environment
   */
  constructor(formId: FormId, paymentType: PaymentType, environment: Environment.Type) {
    this.formId = formId;
    this.paymentType = paymentType;
    this.baseUrl = this.getIframeBaseUrl(environment);
  }

  /**
   * Get the base URL for the iframe
   * @param environment The Finix environment
   * @returns The base URL for the iframe
   */
  private getIframeBaseUrl(environment: Environment.Type): string {
    const iframeUrl = Environment.IframeUrls[environment];
    return iframeUrl ? `${iframeUrl}?` : "";
  }

  /**
   * Create an iframe for a specific field type
   * @param fieldType The type of field to create
   * @param options Configuration options for the field
   * @returns An iframe element configured for the field
   */
  public createFieldIframe(fieldType: string, options: FieldOptions): HTMLIFrameElement {
    // Filter out undefined values to keep the payload clean
    const cleanOptions = cleanObject({
      autoComplete: options.autoComplete,
      defaultOption: options.defaultOption,
      defultValue: options.defaultValue,
      errorMessage: options.errorMessage,
      fonts: options.fonts,
      formId: this.formId,
      options: options.options,
      paymentInstrumentType: PAYMENT_INSTRUMENTS[this.paymentType],
      placeholder: options.placeholder,
      styles: options.styles,
      type: fieldType,
      validations: options.validations,
    });

    // Encode the options to make them URL-safe
    const encodedOptions = Buffer.from(JSON.stringify(cleanOptions));

    // Create a secure iframe
    const iframe = document.createElement("iframe");
    iframe.src = `${this.baseUrl}${encodedOptions}`;
    iframe.style.border = "none";

    // Track this iframe
    this.iframes.push(iframe);

    return iframe;
  }

  /**
   * Set up a message listener for iframe communication
   * @param callback Function to call when a message is received
   * @returns A cleanup function to remove the listener
   */
  public setupMessageListener(callback: (message: IframeMessage) => void) {
    if (window === undefined) return;

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

  /**
   * Submit data through the iframe
   * @param environment The Finix environment
   * @param applicationId The application ID
   * @param sessionId Session ID for fraud detection
   * @param data Additional data to submit
   * @returns A promise that resolves with the response
   */
  public submitWithData(environment: Environment.Type, applicationId: string, sessionId: string, data: Record<string, unknown> = {}): Promise<{ id: string }> {
    return new Promise((resolve, reject) => {
      // Ensure we have iframes to work with
      if (this.iframes.length === 0) {
        reject(new Error("No iframes available for submission"));
        return;
      }

      // Create a unique message ID for this submission
      const messageId = `${Date.now()}-${Math.random()}`;

      // Set up a one-time message handler for the response
      const responseHandler = (event: MessageEvent) => {
        const message = event.data as IframeMessage;

        // Only process messages with our message ID
        if (message?.messageId !== messageId) return;

        // Handle success or error
        if (message.messageName === MessageType.RESPONSE_RECEIVED) {
          resolve(message.messageData as { id: string });
          window.removeEventListener("message", responseHandler);
        } else if (message.messageName === MessageType.RESPONSE_ERROR) {
          reject({
            status: (message.messageData as { status: number })?.status,
            ...(message.messageData || {}),
          });
          window.removeEventListener("message", responseHandler);
        }
      };

      // Add the response handler
      window.addEventListener("message", responseHandler);

      // Add the fraud session ID to the data
      const enhancedData = {
        ...data,
        fraud_session_id: sessionId,
      };

      // Send the submission message to the first iframe
      // (all fields share the same form, so any iframe can process the submission)
      const iframe = this.iframes[0];
      const contentWindow = iframe?.contentWindow;

      if (!contentWindow) {
        reject(new Error("Iframe content window not available"));
        window.removeEventListener("message", responseHandler);
        return;
      }

      contentWindow.postMessage(
        {
          messageId,
          messageName: MessageType.SUBMIT,
          formId: this.formId,
          messageData: {
            environment,
            applicationId,
            data: enhancedData,
          },
        },
        "*",
      );
    });
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
   * Clean up all iframes and event listeners
   */
  public destroy(): void {
    // Remove all message handlers
    this.messageHandlers.forEach((handler) => {
      window.removeEventListener("message", handler);
    });
    this.messageHandlers = [];

    // Remove iframe references
    this.iframes.length = 0;
  }
}
