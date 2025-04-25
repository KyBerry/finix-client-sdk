import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { BasePaymentForm } from "@/products";
import { FINIX_ENVIRONMENT } from "@/constants";
import { generateTimestampedId } from "@/utils";

import type { EnvironmentConfig, FormConfig, FormState, IframeMessage, FinixTokenResponse, FieldName, FieldState, FormCallbacks, FormId } from "@/types";

// --- Concrete Mock Implementation for Testing ---
class MockPaymentForm extends BasePaymentForm {
  public updateSubmitButtonStateMock = vi.fn();
  public handleCountryChangeMock = vi.fn();
  public lastSubmitMessageId: string | null = null; // Store the last message ID
  // Store promises locally for verification
  private localSubmissionPromises = new Map<string, { resolve: (value: FinixTokenResponse) => void; reject: (reason?: Error) => void }>();

  // Add public implementation of parent-to-iframe messaging for testing
  public sendMessageToIframe(fieldName: string, type: string, data: unknown): void {
    this.sendMessageToField(fieldName, type, data);
  }

  constructor(environment: EnvironmentConfig, config: FormConfig<any>) {
    // Pass config as 'any' if BasePaymentForm signature is restrictive
    super(environment, config);
  }

  // Implement abstract methods - make public for testing
  public getFormState(): FormState {
    // Minimal implementation - actual state is in base class
    return this["formState"] ?? {}; // Return base state if possible, else empty
  }

  public setFormState(fieldName: FieldName, state: FieldState): void {
    // Minimal implementation - actual state update happens in base class
    this["formState"][fieldName as keyof FormState] = state;
  }

  async submit(): Promise<FinixTokenResponse> {
    const messageId = generateTimestampedId("msg-");
    this.lastSubmitMessageId = messageId; // Store the generated ID
    const promise = new Promise<FinixTokenResponse>((resolve, reject) => {
      this.localSubmissionPromises.set(messageId, { resolve, reject });
      // Trigger the base class promise setup if handleMessage relies on it
      if (this["submissionPromises"]) {
        this["submissionPromises"].set(messageId, { resolve, reject });
      }
    });
    console.log(`Mock submit used local promise map for messageId: ${messageId}`);
    return promise;
  }
  protected updateSubmitButtonState(isFormValid: boolean): void {
    this.updateSubmitButtonStateMock(isFormValid);
  }
  protected initializeFields(): void {}
  protected addFormHeader(form: HTMLElement): void {}
  protected renderFormFields(form: HTMLElement): void {}
  protected addSubmitButton(form: HTMLElement): void {}
  protected _handleCountryChange(country: string): void {
    this.handleCountryChangeMock(country);
  }

  // Helper to get formId
  public getFormId(): FormId {
    return this["formId"];
  }
  // Helper to check local promise map
  public getLocalSubmissionPromise(id: string) {
    return this.localSubmissionPromises.get(id);
  }

  // Helper to expose the protected sendMessageToField method for testing
  protected sendMessageToField(fieldName: string, type: string, data: unknown): void {
    // Find the iframe that corresponds to fieldName
    const iframe = this.fields.find((iframe) => iframe.getAttribute("data-field-name") === fieldName);

    if (iframe?.contentWindow) {
      const messagePayload = {
        formId: this.formId,
        messageName: type,
        messageData: data,
      };

      iframe.contentWindow.postMessage(messagePayload, "*");
    }
  }

  // Add mock methods to update field array
  public addMockIframe(fieldName: string): void {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("data-field-name", fieldName);
    const mockPostMessage = vi.fn();
    Object.defineProperty(iframe, "contentWindow", {
      value: { postMessage: mockPostMessage },
      writable: true,
    });
    this.fields.push(iframe);
  }

  // Access to fields for testing
  public getFields(): HTMLIFrameElement[] {
    return this.fields;
  }
}
// --- End Mock Implementation ---

describe("BasePaymentForm", () => {
  let mockEnvConfig: EnvironmentConfig;
  let mockCallbacks: FormCallbacks;
  let form: MockPaymentForm;
  let mockContainer: HTMLElement;
  let handleMessageActual: (event: MessageEvent) => void; // To store the actual handler

  beforeEach(() => {
    mockEnvConfig = {
      environment: FINIX_ENVIRONMENT.SANDBOX,
      applicationId: "APxxxxxxxxxxxxxxxxx",
      merchantId: "MPxxxxxxxxxxxxxxxxx",
      enableFraudDetection: false,
    };
    mockCallbacks = {
      onLoad: vi.fn(),
      onUpdate: vi.fn(),
      onValidationError: vi.fn(),
      onSubmit: vi.fn(),
      onTokenize: vi.fn(),
      onTokenizeError: vi.fn(),
    };
    mockContainer = document.createElement("div");
    mockContainer.id = "test-container";
    document.body.appendChild(mockContainer);

    vi.spyOn(document, "getElementById").mockReturnValue(mockContainer);
    // Spy on addEventListener to capture the handler
    vi.spyOn(window, "addEventListener").mockImplementation((event, handler) => {
      if (event === "message") {
        handleMessageActual = handler as (event: MessageEvent) => void; // Use specific type
      }
    });
    vi.spyOn(window, "removeEventListener");

    vi.clearAllMocks();
    (document.getElementById as Mock).mockReturnValue(mockContainer);
    // Re-apply addEventListener spy after clearAllMocks
    (window.addEventListener as Mock).mockImplementation((event, handler) => {
      if (event === "message") {
        handleMessageActual = handler as (event: MessageEvent) => void; // Use specific type
      }
    });
  });

  afterEach(() => {
    document.body.removeChild(mockContainer);
    vi.restoreAllMocks();
  });

  describe("Initialization", () => {
    it("should set formId matching timestamp-random format", () => {
      const testConfig: FormConfig<"card"> = { paymentType: "card", callbacks: mockCallbacks };
      const testForm = new MockPaymentForm(mockEnvConfig, testConfig);
      expect(testForm.getFormId()).toMatch(/^form-\d{13,}-[a-z0-9]+$/);
    });

    // Test initialization side-effects if possible (e.g., initial state affecting submit button)
    // Cannot reliably test internal state like environment or config without getters
  });

  describe("Rendering", () => {
    beforeEach(() => {
      const testConfig: FormConfig<"card"> = { paymentType: "card", callbacks: mockCallbacks };
      form = new MockPaymentForm(mockEnvConfig, testConfig);
    });

    it("should clear container, setup listener, and call onLoad", () => {
      mockContainer.innerHTML = "<div>Old Content</div>";
      form.render("test-container");

      expect(document.getElementById).toHaveBeenCalledWith("test-container");
      expect(mockContainer.innerHTML).not.toContain("Old Content");
      expect(window.addEventListener).toHaveBeenCalledWith("message", expect.any(Function));
      expect(handleMessageActual).toBeDefined(); // Check that handler was captured
      expect(mockCallbacks.onLoad).toHaveBeenCalledOnce();
    });

    it("should cleanup old message listeners on re-render", () => {
      form.render("test-container"); // First render, adds listener
      const firstHandler = handleMessageActual;
      expect(firstHandler).toBeDefined();
      (window.addEventListener as Mock).mockClear(); // Clear calls from first render

      form.render("test-container"); // Second render
      const secondHandler = handleMessageActual;

      expect(window.removeEventListener).toHaveBeenCalledWith("message", firstHandler);
      expect(window.addEventListener).toHaveBeenCalledWith("message", secondHandler);
      expect(secondHandler).toBeDefined();
      expect(secondHandler).not.toBe(firstHandler); // Ensure a new handler is added
    });
  });

  describe("Message Handling (via captured listener)", () => {
    beforeEach(() => {
      const testConfig: FormConfig<"card"> = { paymentType: "card", callbacks: mockCallbacks };
      form = new MockPaymentForm(mockEnvConfig, testConfig);
      form.render("test-container"); // Setup listener and capture handler
      expect(handleMessageActual).toBeDefined(); // Ensure handler is captured
    });

    it("should handle 'response-received' and call onTokenize", async () => {
      const mockTokenResponse: FinixTokenResponse = { data: { id: "tok_123" } };
      const submitPromise = form.submit(); // Creates the promise entry
      const messageId = form.lastSubmitMessageId; // Get the ID generated by submit()
      expect(messageId).toBeDefined(); // Ensure submit generated an ID

      const message: IframeMessage = {
        formId: form.getFormId(),
        messageName: "response-received",
        messageId: messageId!, // Use the ID from submit()
        messageData: mockTokenResponse,
      };
      const mockEvent = new MessageEvent("message", { data: message, origin: "https://js.finix.com" });

      // Invoke the handler AFTER setting up the promise
      handleMessageActual(mockEvent);

      // Await the promise that was set up by submit()
      await expect(submitPromise).resolves.toEqual(mockTokenResponse);
      expect(mockCallbacks.onTokenize).toHaveBeenCalledWith(mockTokenResponse.data?.id);
      expect(mockCallbacks.onTokenizeError).not.toHaveBeenCalled();
    });

    it("should handle 'response-error' and call onTokenizeError", async () => {
      const mockErrorData = { status: 400, message: "Invalid data" };
      const submitPromise = form.submit();
      const messageId = form.lastSubmitMessageId; // Get the ID generated by submit()
      expect(messageId).toBeDefined(); // Ensure submit generated an ID

      const message: IframeMessage = {
        formId: form.getFormId(),
        messageName: "response-error",
        messageId: messageId!, // Use the ID from submit()
        messageData: mockErrorData,
      };
      const mockEvent = new MessageEvent("message", { data: message, origin: "https://js.finix.com" });

      handleMessageActual(mockEvent);

      // Expect the promise to reject with an Error object matching the expected message
      const expectedErrorMessage = `Iframe submission failed: ${JSON.stringify(mockErrorData)}`;
      await expect(submitPromise).rejects.toThrowError(expectedErrorMessage);
      expect(mockCallbacks.onTokenizeError).toHaveBeenCalledWith(mockErrorData);
      expect(mockCallbacks.onTokenize).not.toHaveBeenCalled();
    });

    it("should handle 'field-updated' and call onUpdate callback", () => {
      const fieldName: FieldName = "number";
      const updatedState: FieldState = {
        isDirty: true,
        isFocused: true,
        errorMessages: [],
      };
      const message: IframeMessage = {
        formId: form.getFormId(),
        messageName: "field-updated",
        messageData: { name: fieldName, state: updatedState },
      };
      const mockEvent = new MessageEvent("message", { data: message, origin: "https://js.finix.com" });

      // Process the message
      handleMessageActual(mockEvent);

      // Verify onUpdate callback was called with the updated state
      expect(mockCallbacks.onUpdate).toHaveBeenCalledOnce();
      const lastOnUpdateCall = (mockCallbacks.onUpdate as Mock).mock.calls[0];
      expect(lastOnUpdateCall![0]?.[fieldName]).toEqual(updatedState);
      // Verify updateSubmitButtonState was called (indirectly checks _checkFormValidity)
      expect(form.updateSubmitButtonStateMock).toHaveBeenCalled();
    });

    it("should handle 'field-updated' with errors and call onValidationError", () => {
      const fieldName: FieldName = "number";
      const errorMessages = ["Invalid card number"];
      const updatedState: FieldState = {
        isDirty: true,
        isFocused: false,
        errorMessages: errorMessages,
      };
      const message: IframeMessage = {
        formId: form.getFormId(),
        messageName: "field-updated",
        messageData: { name: fieldName, state: updatedState },
      };
      const mockEvent = new MessageEvent("message", { data: message, origin: "https://js.finix.com" });

      // Mock the validation element
      const validationElement = document.createElement("span");
      validationElement.id = `${form.getFormId()}-${fieldName}-validation`;
      (document.getElementById as Mock).mockReturnValueOnce(validationElement);

      // Process the message
      handleMessageActual(mockEvent);

      // Verify validation message in DOM
      expect(document.getElementById).toHaveBeenCalledWith(validationElement.id);
      expect(validationElement.textContent).toBe(errorMessages[0]);
      // Verify onValidationError callback
      expect(mockCallbacks.onValidationError).toHaveBeenCalledWith(fieldName, errorMessages);
      // Verify onUpdate reflects errors (formHasErrors = true)
      expect(mockCallbacks.onUpdate).toHaveBeenCalledWith(expect.anything(), expect.anything(), true);
      // Verify submit button state update reflects invalidity
      expect(form.updateSubmitButtonStateMock).toHaveBeenCalledWith(false);
    });

    it("should handle 'field-updated' for country change", () => {
      const fieldName: FieldName = "address_country";
      const newCountry = "CAN";
      const updatedState: FieldState = {
        isDirty: true,
        isFocused: false,
        errorMessages: [],
        selected: newCountry,
      };
      const message: IframeMessage = {
        formId: form.getFormId(),
        messageName: "field-updated",
        messageData: { name: fieldName, state: updatedState },
      };
      const mockEvent = new MessageEvent("message", { data: message, origin: "https://js.finix.com" });

      handleMessageActual(mockEvent);

      // Verify the mock _handleCountryChange was called
      expect(form.handleCountryChangeMock).toHaveBeenCalledWith(newCountry);
    });

    it("should handle 'bin-information-received' and store bin info and call onUpdate", () => {
      const binInfo = {
        brand: "visa",
        country: "USA",
        type: "debit",
      };

      const message: IframeMessage = {
        formId: form.getFormId(),
        messageName: "bin-information-received",
        messageData: binInfo,
      };

      const mockEvent = new MessageEvent("message", { data: message, origin: "https://js.finix.com" });

      // Process the message
      handleMessageActual(mockEvent);

      // Verify bin info was stored
      expect((form as any).binInformation).toEqual(binInfo);
      expect(mockCallbacks.onUpdate).toHaveBeenCalled();
    });
  });

  describe("Parent-to-iframe Messaging", () => {
    beforeEach(() => {
      const testConfig: FormConfig<"card"> = { paymentType: "card", callbacks: mockCallbacks };
      form = new MockPaymentForm(mockEnvConfig, testConfig);

      // Manually add mock iframes to the form
      form.addMockIframe("number");
      form.addMockIframe("expiration_date");
    });

    it("should find the correct iframe and send message", () => {
      const fieldName = "number";
      const messageType = "focus";
      const messageData = { someData: "value" };

      form.sendMessageToIframe(fieldName, messageType, messageData);

      // Get the iframe that should have received the message
      const iframes = form.getFields();
      const targetIframe = iframes.find((iframe) => iframe.getAttribute("data-field-name") === fieldName);

      // Verify postMessage was called on the correct iframe
      expect(targetIframe).toBeDefined();
      expect(targetIframe?.contentWindow?.postMessage).toHaveBeenCalledWith(
        {
          formId: form.getFormId(),
          messageName: messageType,
          messageData: messageData,
        },
        "*",
      );
    });

    it("should not send message if iframe is not found", () => {
      const fieldName = "nonexistent-field";
      const messageType = "focus";
      const messageData = { someData: "value" };

      form.sendMessageToIframe(fieldName, messageType, messageData);

      // Get all iframes
      const iframes = form.getFields();

      // Verify no iframe received a message
      iframes.forEach((iframe) => {
        expect(iframe.contentWindow?.postMessage).not.toHaveBeenCalled();
      });
    });

    it("should correctly format message payload", () => {
      const fieldName = "expiration_date";
      const messageType = "blur";
      const messageData = { foo: "bar" };

      form.sendMessageToIframe(fieldName, messageType, messageData);

      // Get the iframe that should have received the message
      const iframes = form.getFields();
      const targetIframe = iframes.find((iframe) => iframe.getAttribute("data-field-name") === fieldName);

      // Verify the message format
      expect(targetIframe?.contentWindow?.postMessage).toHaveBeenCalledWith(
        {
          formId: form.getFormId(),
          messageName: messageType,
          messageData: messageData,
        },
        "*",
      );
    });
  });
});
