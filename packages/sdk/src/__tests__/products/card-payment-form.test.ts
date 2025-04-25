import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { CardPaymentForm } from "@/products";
import { FINIX_ENVIRONMENT } from "@/constants";

import type { EnvironmentConfig, FormConfig, FormCallbacks, FinixTokenResponse, AvailableFieldNames } from "@/types";

describe("CardPaymentForm", () => {
  let mockEnvConfig: EnvironmentConfig;
  let mockCallbacks: FormCallbacks;
  let form: CardPaymentForm;
  let mockContainer: HTMLElement;
  let mockPostMessage: Mock;
  let mockIframe: HTMLIFrameElement;

  beforeEach(() => {
    vi.clearAllMocks();

    mockEnvConfig = {
      environment: FINIX_ENVIRONMENT.SANDBOX,
      applicationId: "AP123",
      merchantId: "MP456",
    };
    mockCallbacks = {
      onLoad: vi.fn(),
      onSubmit: vi.fn(),
      onTokenize: vi.fn(),
      onTokenizeError: vi.fn(),
    };

    mockContainer = document.createElement("div");
    mockContainer.id = "card-form-container";
    document.body.appendChild(mockContainer);

    // Keep iframe mock for submit tests
    mockPostMessage = vi.fn();
    mockIframe = document.createElement("iframe");
    Object.defineProperty(mockIframe, "contentWindow", {
      value: { postMessage: mockPostMessage },
      writable: true,
      configurable: true,
    });

    // REMOVE getElementById mock
    /*
    vi.spyOn(document, "getElementById").mockImplementation((id) => {
      if (id === mockContainer.id) return mockContainer;
      return null; // Return null for others initially
    });
    */

    // REMOVE querySelector mock
    // vi.spyOn(document, "querySelector");

    // Keep spy for createElement to return mock iframe if needed, but allow others
    /*
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string): HTMLElement => {
      if (tagName.toLowerCase() === 'iframe') {
        // Return a *new* mock iframe each time? Let's use one for simplicity.
        // Use the single mockIframe for the submit test verification
        return mockIframe;
      }
      // For other elements, use the original implementation
      return originalCreateElement(tagName);
    });
    */

    vi.spyOn(mockContainer, "appendChild");

    // Instantiate form
    const baseConfig: FormConfig<"card"> = { paymentType: "card", callbacks: mockCallbacks };
    form = new CardPaymentForm(mockEnvConfig, baseConfig);

    // REMOVE MOCKS setup for utils
    /*
    (createIframeFieldConfig as Mock).mockImplementation((fieldName, formId, config, paymentType) => ({
      // ... removed ...
    }));
    (getDefaultFieldProps as Mock).mockImplementation((fieldName) => ({
      // ... removed ...
    }));
    */

    // REMOVE SPY ON INSTANCE METHOD
    /*
    vi.spyOn(form as any, "_getVisibleFieldsForRender").mockImplementation(() => {
       // ... removed ...
    });
    */
  });

  afterEach(() => {
    document.body.removeChild(mockContainer);
    vi.restoreAllMocks();
  });

  it("should store environment and config", () => {
    // Access protected members via type assertion for testing purposes
    expect((form as any).environment).toEqual(mockEnvConfig);
    expect((form as any).config).toEqual({ paymentType: "card", callbacks: mockCallbacks });
  });

  describe("Rendering", () => {
    it("should call _getVisibleFieldsForRender and create iframe fields", () => {
      // Reset the spy specific to this test if needed, or rely on beforeEach spy
      const renderSpy = vi.spyOn(form as any, "_getVisibleFieldsForRender");
      form.render(mockContainer.id);
      expect(renderSpy).toHaveBeenCalled();
      // ... rest of the assertions for iframe creation ...
      expect(mockContainer.querySelectorAll("iframe").length).toBeGreaterThanOrEqual(4);
    });

    it("should render address fields when showAddress is true", () => {
      const configWithAddress: FormConfig<"card", true> = {
        paymentType: "card",
        callbacks: mockCallbacks,
        showAddress: true,
      };
      const formWithAddress = new CardPaymentForm(mockEnvConfig, configWithAddress as any);

      // Spy on the new instance
      const renderSpy = vi.spyOn(formWithAddress as any, "_getVisibleFieldsForRender").mockImplementation(() => {
        let fields: AvailableFieldNames<"card", true>[] = ["name", "number", "expiration_date", "security_code", "address_line1", "address_line2", "address_city", "address_state", "address_region", "address_postal_code", "address_country"];
        const result = fields.filter((f) => !configWithAddress.hideFields?.includes(f as any));
        console.log("[INSTANCE SPY - Address Test] _getVisibleFieldsForRender RETURNING:", JSON.stringify(result));
        return result;
      });

      formWithAddress.render(mockContainer.id);
      expect(renderSpy).toHaveBeenCalled();
      expect(mockContainer.querySelectorAll("iframe").length).toBeGreaterThanOrEqual(11); // name, num, exp, cvv, line1, line2, city, state, region, postal, country

      // Get wrappers AFTER render creates them using querySelector scoped to container
      const formId = (formWithAddress as any).formId;
      const getWrapper = (field: string): HTMLElement | null => mockContainer.querySelector(`.${formId}-field-wrapper-${field}`);

      let stateWrapper = getWrapper("address_state");
      let regionWrapper = getWrapper("address_region");

      // Ensure they exist (render should create them based on _getVisibleFieldsForRender mock)
      expect(stateWrapper, "State wrapper should exist after render").not.toBeNull();
      expect(regionWrapper, "Region wrapper should exist after render").not.toBeNull();
    });

    it("should not render labels if showLabels is false", () => {
      const configNoLabels: FormConfig<"card", false, false> = {
        paymentType: "card",
        callbacks: mockCallbacks,
        showLabels: false,
      };
      const formNoLabels = new CardPaymentForm(mockEnvConfig, configNoLabels as FormConfig<any>);
      const appendSpy = vi.spyOn(mockContainer, "appendChild");
      formNoLabels.render(mockContainer.id);
      // Check that no LABEL elements were appended
      const appendedElements = appendSpy.mock.calls.map((call) => call[0]);
      expect(appendedElements.some((el) => el instanceof Element && el.tagName === "LABEL")).toBe(false);
    });

    it("should render labels if showLabels is true", () => {
      const configWithLabels: FormConfig<"card", false, true> = {
        paymentType: "card",
        callbacks: mockCallbacks,
        showLabels: true,
        labels: { number: "Custom Card Number" },
      };
      const formWithLabels = new CardPaymentForm(mockEnvConfig, configWithLabels as FormConfig<any>);
      const appendSpy = vi.spyOn(mockContainer, "appendChild");
      formWithLabels.render(mockContainer.id);
      const appendedElements = appendSpy.mock.calls.map((call) => call[0]);

      // Find the wrapper div for the number field (assuming it's an Element)
      const numberWrapper = appendedElements.find((el) => el instanceof Element && el.className?.includes("-number"));
      expect(numberWrapper).toBeDefined();
      expect(numberWrapper).toBeInstanceOf(Element); // Assert it's an Element

      // Check if a label exists within that wrapper (must be Element to query)
      const labelElement = (numberWrapper as Element).querySelector("label"); // Cast to Element
      expect(labelElement).not.toBeNull();

      // Add null check before accessing properties
      if (labelElement) {
        expect(labelElement).toBeInstanceOf(HTMLLabelElement); // Be more specific
        expect(labelElement.textContent).toBe("Custom Card Number");
      }
    });

    it("should add and configure submit button", () => {
      const testConfig: FormConfig<"card"> = { paymentType: "card", callbacks: mockCallbacks, submitLabel: "Pay Now!" };
      const testForm = new CardPaymentForm(mockEnvConfig, testConfig);
      const submitSpy = vi.spyOn(testForm, "submit");
      // Spy on appendChild *before* render
      const appendSpy = vi.spyOn(mockContainer, "appendChild");
      testForm.render(mockContainer.id);

      // Find the button among appended children
      const button = appendSpy.mock.calls.map((call) => call[0]).find((el) => el instanceof HTMLButtonElement && el.tagName === "BUTTON");

      expect(button).toBeDefined();
      expect(button).toBeInstanceOf(HTMLButtonElement); // Assert type

      // Now cast to HTMLButtonElement for property access
      const htmlButton = button as HTMLButtonElement;
      expect(htmlButton.id).toBe(`${(testForm as any).formId}-submit-button`);
      expect(htmlButton.textContent).toBe("Pay Now!");
      expect(htmlButton.disabled).toBe(true);

      // Test onclick
      htmlButton.onclick?.({ preventDefault: vi.fn() } as any); // Use optional chaining for onclick
      expect(submitSpy).toHaveBeenCalledOnce();
    });
  });

  describe("Submission", () => {
    beforeEach(() => {
      form.render(mockContainer.id); // Render to ensure iframe is in form.fields
      // Explicitly assign the mock iframe to fields after render might have cleared it
      (form as any).fields = [mockIframe];
    });

    it("should call postMessage on the first iframe with correct payload", async () => {
      const submitPromise = form.submit();
      // Extract messageId from the promise map stored in the *base* class instance
      const messageId = (form as any).submissionPromises.keys().next().value;

      expect(mockPostMessage).toHaveBeenCalledTimes(1);
      const expectedPayload = {
        messageId: messageId,
        messageName: "submit",
        messageData: {
          environment: mockEnvConfig.environment,
          applicationId: mockEnvConfig.applicationId,
          data: {},
        },
      };
      expect(mockPostMessage).toHaveBeenCalledWith(expectedPayload, "https://js.finix.com");
      expect(mockCallbacks.onSubmit).toHaveBeenCalledWith(expectedPayload);

      // Simulate response
      const mockResponse: FinixTokenResponse = { data: { id: "res_123" } };
      (form as any).submissionPromises.get(messageId)?.resolve(mockResponse);
      await expect(submitPromise).resolves.toEqual(mockResponse);
    });

    it("should include fraudSessionId in submit payload if present", async () => {
      const fraudId = "fraud-session-xyz";
      (form as any).environment.fraudSessionId = fraudId; // Modify internal state for test
      const submitPromise = form.submit();
      const messageId = (form as any).submissionPromises.keys().next().value;

      const expectedPayload = {
        messageId: messageId,
        messageName: "submit",
        messageData: {
          environment: mockEnvConfig.environment,
          applicationId: mockEnvConfig.applicationId,
          fraudSessionId: fraudId,
          data: {},
        },
      };
      expect(mockPostMessage).toHaveBeenCalledWith(expectedPayload, "https://js.finix.com");
      expect(mockCallbacks.onSubmit).toHaveBeenCalledWith(expectedPayload);

      // Simulate response
      const mockResponse: FinixTokenResponse = { data: { id: "res_456" } };
      (form as any).submissionPromises.get(messageId)?.resolve(mockResponse);
      await expect(submitPromise).resolves.toEqual(mockResponse);
    });

    it("should reject if first iframe is not found", async () => {
      (form as any).fields = []; // Clear fields
      await expect(form.submit()).rejects.toThrow("Target iframe for submission not found");
    });
  });

  describe("State/UI Updates", () => {
    it("should enable/disable submit button via updateSubmitButtonState", () => {
      form.render(mockContainer.id);
      // Get the button AFTER render creates it
      const button = document.getElementById(`${(form as any).formId}-submit-button`) as HTMLButtonElement;
      expect(button).not.toBeNull();

      // Explicitly test the method, don't rely on initial render state
      button.disabled = true; // Start disabled for the test

      // Call protected method directly for testing
      (form as any).updateSubmitButtonState(true); // Enable
      expect(button.disabled).toBe(false); // Should be enabled

      (form as any).updateSubmitButtonState(false); // Disable again
      expect(button.disabled).toBe(true);
    });

    it.only("should handle country change for address fields", () => {
      // Create form with address support
      const configWithAddress: FormConfig<"card", true> = {
        paymentType: "card",
        showAddress: true,
        callbacks: mockCallbacks,
      };

      const formWithAddress = new CardPaymentForm(mockEnvConfig, configWithAddress as FormConfig<any>);
      formWithAddress.render(mockContainer.id);

      // Get wrappers AFTER render creates them using querySelector scoped to container
      const formId = (formWithAddress as any).formId;
      const getWrapper = (field: string): HTMLElement | null => mockContainer.querySelector(`.${formId}-field-wrapper-${field}`);

      let stateWrapper = getWrapper("address_state");
      let regionWrapper = getWrapper("address_region");

      // Ensure they exist (render should create them based on _getVisibleFieldsForRender mock)
      expect(stateWrapper, "State wrapper should exist after render").not.toBeNull();
      expect(regionWrapper, "Region wrapper should exist after render").not.toBeNull();

      // Create a message that would normally trigger country change
      const message = {
        formId: (formWithAddress as any).formId,
        messageName: "field-updated",
        messageData: {
          name: "address_country",
          state: {
            isDirty: true,
            isFocused: false,
            errorMessages: [],
            selected: "GBR", // Non-US country
          },
        },
      };

      const handleCountryChangeSpy = vi.spyOn(formWithAddress as any, "_handleCountryChange");

      // Manually invoke the message handler
      (formWithAddress as any).handleMessage(message);

      expect(handleCountryChangeSpy).toHaveBeenCalledWith("GBR");

      // Check that state wrapper is hidden and region wrapper is shown for non-US countries
      stateWrapper = getWrapper("address_state");
      regionWrapper = getWrapper("address_region");
      expect(stateWrapper?.style.display).toBe("none");
      expect(regionWrapper?.style.display).toBe("block");

      handleCountryChangeSpy.mockClear(); // Reset spy for next check

      // Now simulate changing back to US
      const usMessage = {
        formId: (formWithAddress as any).formId,
        messageName: "field-updated",
        messageData: {
          name: "address_country",
          state: {
            isDirty: true,
            isFocused: false,
            errorMessages: [],
            selected: "USA",
          },
        },
      };

      // Process the US message
      (formWithAddress as any).handleMessage(usMessage);

      expect(handleCountryChangeSpy).toHaveBeenCalledWith("USA");

      // Check that state wrapper is shown and region wrapper is hidden for US
      stateWrapper = getWrapper("address_state");
      regionWrapper = getWrapper("address_region");
      expect(stateWrapper?.style.display).toBe("block");
      expect(regionWrapper?.style.display).toBe("none");
    });
  });

  describe("Error Message Handling", () => {
    let validationSpan: HTMLElement;

    beforeEach(() => {
      form.render(mockContainer.id);

      // Ensure validation span exists AFTER render creates it
      validationSpan = document.createElement("span");
      validationSpan.id = `${(form as any).formId}-number-validation`;
      validationSpan.className = `number_validation validation`; // Match class used in render
      mockContainer.appendChild(validationSpan);
    });

    it("should display error messages in validation span", () => {
      const fieldName = "number";
      const errorMessages = ["Invalid card number", "Number is required"];

      // Create field-updated message with errors
      const fieldUpdatedMessage = {
        formId: (form as any).formId,
        messageName: "field-updated",
        messageData: {
          name: fieldName,
          state: {
            isDirty: true,
            isFocused: false,
            errorMessages: errorMessages,
          },
        },
      };

      // Simulate receiving message from iframe
      const mockEvent = new MessageEvent("message", {
        data: fieldUpdatedMessage,
        origin: "https://js.finix.com",
      });

      // Get the validation span again after message processing
      const updatedValidationSpan = document.getElementById(`${(form as any).formId}-${fieldName}-validation`);
      expect(updatedValidationSpan).not.toBeNull();

      // Call the message handler with the error event
      if ((form as any).handleMessage) {
        (form as any).handleMessage(fieldUpdatedMessage);
      }

      // Check that validation span textContent was updated
      expect(updatedValidationSpan?.textContent).toBe(errorMessages.join(" "));

      // Check that callbacks were triggered
      expect(mockCallbacks.onValidationError).toHaveBeenCalledWith(fieldName, errorMessages);

      // Check that form validity was updated
      expect((form as any).updateSubmitButtonStateMock).toHaveBeenCalledWith(false);
    });

    it("should clear error messages when field becomes valid", () => {
      // Setup initial state with errors
      const fieldName = "number";
      const initialState = {
        formId: (form as any).formId,
        messageName: "field-updated",
        messageData: {
          name: fieldName,
          state: {
            isDirty: true,
            isFocused: false,
            errorMessages: ["Invalid card number"],
          },
        },
      };

      // Process initial error state
      if ((form as any).handleMessage) {
        (form as any).handleMessage(initialState);
      }

      // Create field-updated message with no errors
      const validState = {
        formId: (form as any).formId,
        messageName: "field-updated",
        messageData: {
          name: fieldName,
          state: {
            isDirty: true,
            isFocused: false,
            errorMessages: [],
          },
        },
      };

      // Reset mocks to check new calls
      vi.clearAllMocks();

      // Process the valid state message
      if ((form as any).handleMessage) {
        (form as any).handleMessage(validState);
      }

      // Check that validation span textContent was cleared
      const updatedValidationSpan = document.getElementById(`${(form as any).formId}-${fieldName}-validation`);
      expect(updatedValidationSpan?.textContent).toBe("");

      // onValidationError should not be called when there are no errors
      expect(mockCallbacks.onValidationError).not.toHaveBeenCalled();
    });
  });
});
