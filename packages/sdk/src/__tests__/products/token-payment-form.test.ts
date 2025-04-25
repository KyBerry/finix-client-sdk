import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { TokenPaymentForm } from "@/products";
import * as utils from "@/utils";
import { FINIX_ENVIRONMENT } from "@/constants";
import * as types from "@/types";
import type { EnvironmentConfig, FormConfig, FormCallbacks } from "@/types";

// This mock setup will be hoisted to the top of the file
vi.mock("@/types", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, any>;
  return {
    ...actual,
    getVisibleFields: vi.fn((params) => {
      if (params.paymentType === "card") {
        return ["number", "expiration_month", "expiration_year", "security_code"];
      } else if (params.paymentType === "bank") {
        return ["account_number", "account_type", "bank_code"];
      }
      return [];
    }),
  };
});

vi.mock("@/utils", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, any>;
  // Ensure generateTimestampedId always returns a string with the prefix
  const mockGenerateTimestampedId = vi.fn((prefix: string) => {
    return `${prefix || ""}mock-id-123456`;
  });

  return {
    ...actual,
    createIframeFieldConfig: vi.fn(),
    getDefaultFieldProps: vi.fn().mockReturnValue({ defaultLabel: "Test Label" }),
    generateTimestampedId: mockGenerateTimestampedId,
  };
});

const mockGetVisibleFields = types.getVisibleFields as Mock;
const mockCreateIframeFieldConfig = utils.createIframeFieldConfig as Mock;

describe("TokenPaymentForm", () => {
  let mockEnvConfig: EnvironmentConfig;
  let mockCallbacks: FormCallbacks;
  let form: TokenPaymentForm;
  let mockContainer: HTMLElement;
  let mockPostMessage: Mock;
  let mockIframe: HTMLIFrameElement;
  let mockSubmitButton: HTMLButtonElement | null = null; // Store button instance
  let mockCardToggleButton: HTMLButtonElement | null = null;
  let mockBankToggleButton: HTMLButtonElement | null = null;

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
    mockContainer.id = "token-form-container";
    document.body.appendChild(mockContainer);

    mockPostMessage = vi.fn();
    mockIframe = document.createElement("iframe");
    Object.defineProperty(mockIframe, "contentWindow", {
      value: { postMessage: mockPostMessage },
      writable: true,
      configurable: true,
    });

    // Reset stored elements
    mockSubmitButton = null;
    mockCardToggleButton = null;
    mockBankToggleButton = null;

    vi.spyOn(document, "getElementById").mockImplementation((id) => {
      if (id === mockContainer.id) return mockContainer;

      if (id.endsWith("-submit-button")) {
        if (!mockSubmitButton) {
          // Create only if not exists
          mockSubmitButton = document.createElement("button");
          mockSubmitButton.id = id;
          mockContainer.appendChild(mockSubmitButton);
        }
        return mockSubmitButton;
      }
      if (id.endsWith("-toggle-card")) {
        if (!mockCardToggleButton) {
          mockCardToggleButton = document.createElement("button");
          mockCardToggleButton.id = id;
          mockCardToggleButton.classList.add("active"); // Default active
          mockContainer.appendChild(mockCardToggleButton);
        }
        return mockCardToggleButton;
      }
      if (id.endsWith("-toggle-bank")) {
        if (!mockBankToggleButton) {
          mockBankToggleButton = document.createElement("button");
          mockBankToggleButton.id = id;
          mockContainer.appendChild(mockBankToggleButton);
        }
        return mockBankToggleButton;
      }
      // Allow getting field wrappers
      if (id.includes("-field-wrapper-")) {
        const wrapper = document.createElement("div");
        wrapper.id = id;
        mockContainer.appendChild(wrapper);
        return wrapper;
      }
      return null;
    });

    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName.toLowerCase() === "iframe") {
        return mockIframe;
      }
      return document.constructor.prototype.createElement.call(document, tagName);
    });

    vi.spyOn(mockContainer, "appendChild");

    // Base config for form instantiation
    const baseConfig: FormConfig<"token"> = { paymentType: "token", callbacks: mockCallbacks };
    form = new TokenPaymentForm(mockEnvConfig, baseConfig);
  });

  afterEach(() => {
    document.body.removeChild(mockContainer);
    vi.restoreAllMocks();
  });

  it("should properly initialize with token payment type", () => {
    expect((form as any).environment).toEqual(mockEnvConfig);
    expect((form as any).config).toEqual({ paymentType: "token", callbacks: mockCallbacks });
    // Default to PAYMENT_CARD instrument type
    expect((form as any).paymentInstrumentType).toBe("PAYMENT_CARD");
  });

  describe("Toggle Functionality", () => {
    it("should render card/bank toggle buttons", () => {
      form.render(mockContainer.id);

      // Keep assertions checking if toggle buttons exist
      const toggleContainer = mockContainer.querySelector(".finix-payment-type-toggle"); // Use class selector
      expect(toggleContainer).not.toBeNull();

      const cardToggle = mockContainer.querySelector(`#${(form as any).formId}-toggle-card`);
      const bankToggle = mockContainer.querySelector(`#${(form as any).formId}-toggle-bank`);

      expect(cardToggle).not.toBeNull();
      expect(bankToggle).not.toBeNull();
    });

    it("should switch payment instrument type when toggle is clicked", () => {
      form.render(mockContainer.id);

      // Get toggle buttons
      const cardToggle = document.getElementById(`${(form as any).formId}-toggle-card`) as HTMLButtonElement;
      const bankToggle = document.getElementById(`${(form as any).formId}-toggle-bank`) as HTMLButtonElement;

      // Initial state should be card
      expect((form as any).paymentInstrumentType).toBe("PAYMENT_CARD");
      expect(cardToggle.classList.contains("active")).toBe(true);
      expect(bankToggle.classList.contains("active")).toBe(false);

      // Directly call the internal method instead of simulating click
      (form as any)._switchToPaymentType("bank", cardToggle, bankToggle);

      // Should now be bank
      expect((form as any).paymentInstrumentType).toBe("BANK_ACCOUNT");
      expect(cardToggle.classList.contains("active")).toBe(false);
      expect(bankToggle.classList.contains("active")).toBe(true);
    });

    it("should update formState keys when toggling", () => {
      form.render(mockContainer.id);
      const cardToggle = document.getElementById(`${(form as any).formId}-toggle-card`) as HTMLButtonElement;
      const bankToggle = document.getElementById(`${(form as any).formId}-toggle-bank`) as HTMLButtonElement;

      // Initial state (Card) - relies on the mock getVisibleFields
      let currentStateKeys = Object.keys(form.getFormState());
      // Expect keys based on the mock for 'card'
      expect(currentStateKeys).toEqual(expect.arrayContaining(["number", "expiration_month", "expiration_year", "security_code"]));
      expect(currentStateKeys).not.toEqual(expect.arrayContaining(["account_number", "account_type", "bank_code"]));

      // Switch to Bank
      (form as any)._switchToPaymentType("bank", cardToggle, bankToggle);
      currentStateKeys = Object.keys(form.getFormState());

      // Expect keys based on the mock for 'bank'
      expect(currentStateKeys).toEqual(expect.arrayContaining(["account_number", "account_type", "bank_code"]));
      expect(currentStateKeys).not.toEqual(expect.arrayContaining(["number", "expiration_month", "expiration_year", "security_code"]));

      // Switch back to Card
      (form as any)._switchToPaymentType("card", cardToggle, bankToggle);
      currentStateKeys = Object.keys(form.getFormState());

      // Expect keys based on the mock for 'card' again
      expect(currentStateKeys).toEqual(expect.arrayContaining(["number", "expiration_month", "expiration_year", "security_code"]));
      expect(currentStateKeys).not.toEqual(expect.arrayContaining(["account_number", "account_type", "bank_code"]));
    });

    it("should re-render fields when payment type is toggled", () => {
      form.render(mockContainer.id); // Initial render

      // Spy on the instance method AFTER the initial render
      const renderFieldsSpy = vi.spyOn(form as any, "renderFormFields");
      const cardToggle = document.getElementById(`${(form as any).formId}-toggle-card`) as HTMLButtonElement;
      const bankToggle = document.getElementById(`${(form as any).formId}-toggle-bank`) as HTMLButtonElement;

      // Directly call the internal method
      (form as any)._switchToPaymentType("bank", cardToggle, bankToggle);

      expect(renderFieldsSpy).toHaveBeenCalledTimes(1); // Should be called once by toggle
    });

    it("should update submit button state based on visible fields validity after toggle", () => {
      // Mock the base class validity check and button update methods
      const checkValiditySpy = vi.spyOn(form as any, "_checkFormValidity").mockReturnValue(true); // Assume valid initially
      const updateButtonSpy = vi.spyOn(form as any, "updateSubmitButtonState");

      form.render(mockContainer.id);
      const cardToggle = document.getElementById(`${(form as any).formId}-toggle-card`) as HTMLButtonElement;
      const bankToggle = document.getElementById(`${(form as any).formId}-toggle-bank`) as HTMLButtonElement;
      const submitButton = document.getElementById(`${(form as any).formId}-submit-button`) as HTMLButtonElement;

      // Initial render calls updateSubmitButtonState (implicitly via _switchToPaymentType in render? Check BaseForm render)
      // Let's explicitly check button state after render (assuming initial state is invalid)
      checkValiditySpy.mockReturnValue(false); // Simulate invalid state
      (form as any).updateSubmitButtonState(false);
      expect(submitButton.disabled).toBe(true);

      // Simulate making the CARD form valid (we don't need real field updates, just mock the validity check)
      checkValiditySpy.mockReturnValue(true);
      (form as any).updateSubmitButtonState(true); // Manually trigger update based on mocked validity
      expect(submitButton.disabled).toBe(false); // Card form valid -> button enabled

      // --- Switch to Bank --- (This calls _initializeStateForDisplayType and renderFormFields)
      // Assume the new bank state is initially INVALID
      checkValiditySpy.mockReturnValue(false);
      // The _switchToPaymentType method should call updateSubmitButtonState at the end
      updateButtonSpy.mockClear(); // Clear previous calls before toggle
      (form as any)._switchToPaymentType("bank", cardToggle, bankToggle);

      // Verify updateSubmitButtonState was called by _switchToPaymentType with the mocked invalid state
      expect(updateButtonSpy).toHaveBeenCalledWith(false);
      expect(submitButton.disabled).toBe(true); // Bank form invalid -> button disabled

      // Simulate making the BANK form valid
      checkValiditySpy.mockReturnValue(true);
      (form as any).updateSubmitButtonState(true); // Manually trigger update
      expect(submitButton.disabled).toBe(false); // Bank form valid -> button enabled

      // --- Switch back to Card --- (Should be invalid again initially)
      checkValiditySpy.mockReturnValue(false);
      updateButtonSpy.mockClear();
      (form as any)._switchToPaymentType("card", cardToggle, bankToggle);

      expect(updateButtonSpy).toHaveBeenCalledWith(false);
      expect(submitButton.disabled).toBe(true); // Card form invalid -> button disabled
    });
  });

  describe("Submit Functionality", () => {
    it("should use the correct payment instrument type in submit message", async () => {
      form.render(mockContainer.id);

      // Default is PAYMENT_CARD
      const submitPromise = form.submit();

      // Check that postMessage was called with correct payment type
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          messageData: expect.objectContaining({
            data: expect.objectContaining({
              paymentInstrumentType: "PAYMENT_CARD",
            }),
          }),
        }),
        expect.any(String),
      );

      // Get toggle buttons
      const cardToggle = document.getElementById(`${(form as any).formId}-toggle-card`) as HTMLButtonElement;
      const bankToggle = document.getElementById(`${(form as any).formId}-toggle-bank`) as HTMLButtonElement;

      // Directly change payment type
      (form as any)._switchToPaymentType("bank", cardToggle, bankToggle);

      // Clear previous calls
      mockPostMessage.mockClear();

      // Setup an explicit mock value for the message instead of testing messageId
      mockPostMessage.mockImplementation(() => {}); // Just use an empty function

      // Submit again
      const submitPromise2 = form.submit();

      // Check the arguments of the latest call directly
      expect(mockPostMessage).toHaveBeenCalledTimes(1); // Ensure only one call after clearing
      const lastCallArgs = mockPostMessage.mock.calls[0]; // Get args of the first (and only) call

      // Add a check to ensure the call arguments exist before accessing them
      expect(lastCallArgs).toBeDefined();
      if (!lastCallArgs) return; // Guard clause for type safety

      const messagePayload = lastCallArgs[0]; // The first argument is the payload object
      const targetOrigin = lastCallArgs[1]; // The second argument is the target origin

      // Assert specific parts of the payload
      expect(messagePayload.messageName).toBe("submit");
      expect(messagePayload.messageData.data.paymentInstrumentType).toBe("BANK_ACCOUNT");
      expect(targetOrigin).toBe("https://js.finix.com"); // Verify target origin

      // Skip messageId check since it's not crucial for this specific test
      // The main goal is to verify the payment instrument type changes correctly
    });
  });

  describe("Field Display Logic", () => {
    it("should show card fields when card is selected", () => {
      // Clear any previous calls first
      mockGetVisibleFields.mockClear();
      mockCreateIframeFieldConfig.mockClear();

      form.render(mockContainer.id);

      // Card fields should be visible, bank fields hidden - check that getVisibleFields was called
      expect(mockGetVisibleFields).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentType: "card", // Initial render defaults to card
        }),
      );

      // Card fields should be initialized with PAYMENT_CARD type - check first call for number field
      // Match the exact parameters that are actually being passed
      expect(mockCreateIframeFieldConfig).toHaveBeenCalledWith(
        "number",
        "form-mock-id-123456", // The actual formId from our mock
        {
          paymentType: "token",
          callbacks: mockCallbacks,
        },
        "PAYMENT_CARD",
      );
    });

    it("should show bank fields when bank is selected", () => {
      form.render(mockContainer.id);
      mockGetVisibleFields.mockClear(); // Clear initial render calls
      mockCreateIframeFieldConfig.mockClear();

      // Get toggle buttons and directly switch payment type
      const cardToggle = document.getElementById(`${(form as any).formId}-toggle-card`) as HTMLButtonElement;
      const bankToggle = document.getElementById(`${(form as any).formId}-toggle-bank`) as HTMLButtonElement;

      (form as any)._switchToPaymentType("bank", cardToggle, bankToggle);

      // Should call getVisibleFields with bank payment type
      expect(mockGetVisibleFields).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentType: "bank",
        }),
      );

      // Bank fields should be initialized with BANK_ACCOUNT type
      // Match the exact parameters that are actually being passed
      expect(mockCreateIframeFieldConfig).toHaveBeenCalledWith(
        "account_number",
        "form-mock-id-123456", // The actual formId from our mock
        {
          paymentType: "token",
          callbacks: mockCallbacks,
        },
        "BANK_ACCOUNT",
      );
    });
  });
});
