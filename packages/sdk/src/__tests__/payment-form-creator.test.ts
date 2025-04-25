import { describe, it, expect, vi, beforeEach } from "vitest";
import { PaymentFormCreator } from "@/creators/payment-form-creator"; // Corrected path
import { BasePaymentForm } from "@/products/base-payment-form"; // Corrected path
import { CardPaymentForm } from "@/products/card-payment-form"; // Corrected path
import { BankPaymentForm } from "@/products/bank-payment-form"; // Corrected path
import { TokenPaymentForm } from "@/products/token-payment-form"; // Corrected path
import type { EnvironmentConfig, FormConfig } from "@/types";
import { FINIX_ENVIRONMENT } from "@/constants";
// Mock FraudDetection service
import { FraudDetection } from "@/services/fraud-detection";

// Mock dependencies using correct paths
// Provide a more complete mock implementation
const mockFormInstance = {
  render: vi.fn(),
  initializeFormState: vi.fn(), // Keep necessary mocked methods
  // Add any other methods called by PaymentFormCreator
};

// --- Revised Mocking Strategy --- //
// Mock the actual classes to return instances that pass instanceof checks
class MockBaseForm {
  render = vi.fn();
  initializeFormState = vi.fn();
  constructor() {
    /* Mock constructor */
  }
}
class MockCardForm extends MockBaseForm {
  constructor() {
    super();
  }
}
class MockBankForm extends MockBaseForm {
  constructor() {
    super();
  }
}
class MockTokenForm extends MockBaseForm {
  constructor() {
    super();
  }
}

vi.mock("@/products/base-payment-form", () => ({ BasePaymentForm: vi.fn(() => new MockBaseForm()) }));
vi.mock("@/products/card-payment-form", () => ({ CardPaymentForm: vi.fn(() => new MockCardForm()) }));
vi.mock("@/products/bank-payment-form", () => ({ BankPaymentForm: vi.fn(() => new MockBankForm()) }));
vi.mock("@/products/token-payment-form", () => ({ TokenPaymentForm: vi.fn(() => new MockTokenForm()) }));
// --- End Revised Mocking Strategy --- //

// Mock service dependencies
vi.mock("@/services/fraud-detection", () => ({
  FraudDetection: {
    setup: vi.fn(),
  },
}));

describe("PaymentFormCreator", () => {
  let mockEnvConfig: EnvironmentConfig;
  const mockFraudSessionId = "fraud-session-12345";

  beforeEach(() => {
    // Reset mocks if necessary
    vi.clearAllMocks();

    mockEnvConfig = {
      environment: FINIX_ENVIRONMENT.SANDBOX,
      applicationId: "APxxxxxxxxxxxxxxxxx",
      merchantId: "MPxxxxxxxxxxxxxxxxx",
      enableFraudDetection: false, // Default to false for most tests unless testing fraud
    };

    // Default mock implementation for FraudDetection.setup
    (FraudDetection.setup as ReturnType<typeof vi.fn>).mockResolvedValue(mockFraudSessionId);
  });

  it("should initialize correctly with valid EnvironmentConfig", () => {
    const creator = new PaymentFormCreator(mockEnvConfig);
    // Access internal state for verification if necessary, or rely on behavior
    // expect((creator as any).environment).toEqual(mockEnvConfig);
    expect(creator).toBeInstanceOf(PaymentFormCreator);
  });

  it("should throw error if EnvironmentConfig is invalid (add specific validation tests)", () => {
    // For now, just test the constructor doesn't throw with valid config
    expect(() => new PaymentFormCreator(mockEnvConfig)).not.toThrow();
  });

  // --- NEW Validation Tests ---
  describe("Constructor Validation", () => {
    it("should throw if environment config is missing", () => {
      expect(() => new PaymentFormCreator(null as any)).toThrow("PaymentFormCreator Error: EnvironmentConfig is required.");
    });

    it("should throw if applicationId is missing", () => {
      const invalidConfig = { ...mockEnvConfig, applicationId: undefined as any };
      expect(() => new PaymentFormCreator(invalidConfig)).toThrow("PaymentFormCreator Error: EnvironmentConfig requires a valid applicationId (string).");
    });

    it("should throw if applicationId is not a string", () => {
      const invalidConfig = { ...mockEnvConfig, applicationId: 12345 as any };
      expect(() => new PaymentFormCreator(invalidConfig)).toThrow("PaymentFormCreator Error: EnvironmentConfig requires a valid applicationId (string).");
    });

    it("should throw if merchantId is missing", () => {
      const invalidConfig = { ...mockEnvConfig, merchantId: undefined as any };
      expect(() => new PaymentFormCreator(invalidConfig)).toThrow("PaymentFormCreator Error: EnvironmentConfig requires a valid merchantId (string).");
    });

    it("should throw if merchantId is not a string", () => {
      const invalidConfig = { ...mockEnvConfig, merchantId: 12345 as any };
      expect(() => new PaymentFormCreator(invalidConfig)).toThrow("PaymentFormCreator Error: EnvironmentConfig requires a valid merchantId (string).");
    });

    it("should throw if environment is missing", () => {
      const invalidConfig = { ...mockEnvConfig, environment: undefined as any };
      expect(() => new PaymentFormCreator(invalidConfig)).toThrow("PaymentFormCreator Error: EnvironmentConfig requires a valid environment (string).");
    });

    it("should warn if applicationId does not start with AP", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const configWithBadAppId = { ...mockEnvConfig, applicationId: "XXxxxxxxxxxxxxxxxxx" };
      new PaymentFormCreator(configWithBadAppId);
      expect(warnSpy).toHaveBeenCalledWith("PaymentFormCreator Warning: applicationId does not start with 'AP'. Ensure it is correct.");
      warnSpy.mockRestore();
    });

    it("should NOT warn if applicationId starts with AP", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      new PaymentFormCreator(mockEnvConfig); // Uses correct 'AP...' prefix
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });
  // --- END NEW Validation Tests ---

  describe("Form Creation", () => {
    let creator: PaymentFormCreator;

    beforeEach(() => {
      creator = new PaymentFormCreator(mockEnvConfig);
    });

    it("should create a CardPaymentForm instance", () => {
      const config: FormConfig<"card"> = { paymentType: "card" };
      const form = creator.createForm(config);
      // Constructor now expects EnvironmentConfig first
      expect(CardPaymentForm).toHaveBeenCalledWith(mockEnvConfig, config);
    });

    it("should create a BankPaymentForm instance", () => {
      const config: FormConfig<"bank"> = { paymentType: "bank" };
      const form = creator.createForm(config);
      expect(BankPaymentForm).toHaveBeenCalledWith(mockEnvConfig, config);
    });

    it("should create a TokenPaymentForm instance", () => {
      const config: FormConfig<"token"> = { paymentType: "token" };
      const form = creator.createForm(config);
      expect(TokenPaymentForm).toHaveBeenCalledWith(mockEnvConfig, config);
    });

    it("should throw error for invalid paymentType", () => {
      const config = { paymentType: "invalid" } as unknown as FormConfig<"card">;
      // Check the actual error message based on implementation
      expect(() => creator.createForm(config)).toThrow(/Unsupported payment form type: invalid/);
    });

    it("should pass configuration correctly to the form constructor", () => {
      const config: FormConfig<"card"> = {
        paymentType: "card",
        submitLabel: "Pay Now",
      };
      creator.createForm(config);
      expect(CardPaymentForm).toHaveBeenCalledWith(mockEnvConfig, config);
    });

    it("should warn if fraud detection not initialized before createForm", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const config: FormConfig<"card"> = { paymentType: "card" };
      creator.createForm(config); // Called before renderForm/fraud init
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Fraud detection not initialized"));
      warnSpy.mockRestore();
    });
  });

  describe("Fraud Detection / renderForm", () => {
    it("should call FraudDetection.setup when renderForm is called and fraud is enabled", async () => {
      const envWithFraud: EnvironmentConfig = { ...mockEnvConfig, enableFraudDetection: true };
      const creator = new PaymentFormCreator(envWithFraud);
      const config: FormConfig<"card"> = { paymentType: "card" };

      await creator.renderForm("container-id", config);

      expect(FraudDetection.setup).toHaveBeenCalledTimes(1);
      expect(FraudDetection.setup).toHaveBeenCalledWith(envWithFraud.merchantId, envWithFraud.environment);
      expect((creator as any).environment.fraudSessionId).toBe(mockFraudSessionId);
      expect(CardPaymentForm).toHaveBeenCalled();
    });

    it("should NOT call FraudDetection.setup when renderForm is called and fraud is disabled", async () => {
      const envNoFraud: EnvironmentConfig = { ...mockEnvConfig, enableFraudDetection: false };
      const creator = new PaymentFormCreator(envNoFraud);
      const config: FormConfig<"card"> = { paymentType: "card" };

      await creator.renderForm("container-id", config);

      expect(FraudDetection.setup).not.toHaveBeenCalled();
      expect((creator as any).environment.fraudSessionId).toBeUndefined();
      expect(CardPaymentForm).toHaveBeenCalled();
    });

    it("should NOT call FraudDetection.setup if fraudSessionId already exists", async () => {
      const existingSessionId = "existing-fraud-id";
      const envWithExistingFraud: EnvironmentConfig = {
        ...mockEnvConfig,
        enableFraudDetection: true,
        fraudSessionId: existingSessionId,
      };
      const creator = new PaymentFormCreator(envWithExistingFraud);
      const config: FormConfig<"card"> = { paymentType: "card" };

      await creator.renderForm("container-id", config);

      expect(FraudDetection.setup).not.toHaveBeenCalled();
      expect((creator as any).environment.fraudSessionId).toBe(existingSessionId);
      expect(CardPaymentForm).toHaveBeenCalled();
    });

    it("should handle errors during FraudDetection.setup and proceed", async () => {
      const setupError = new Error("Sift setup failed");
      (FraudDetection.setup as ReturnType<typeof vi.fn>).mockRejectedValue(setupError);
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const envWithFraud: EnvironmentConfig = { ...mockEnvConfig, enableFraudDetection: true };
      const creator = new PaymentFormCreator(envWithFraud);
      const config: FormConfig<"card"> = { paymentType: "card" };

      await expect(creator.renderForm("container-id", config)).resolves.toBeUndefined();

      expect(FraudDetection.setup).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith("Failed to initialize fraud detection: ", setupError);
      expect((creator as any).environment.fraudSessionId).toBeUndefined();
      expect(CardPaymentForm).toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it("should call createForm with the correct config during renderForm", async () => {
      const creator = new PaymentFormCreator(mockEnvConfig);
      const config: FormConfig<"bank"> = { paymentType: "bank" };

      await creator.renderForm("container-id", config);

      const expectedEnv = { ...mockEnvConfig, fraudSessionId: undefined };
      expect(BankPaymentForm).toHaveBeenCalledWith(expectedEnv, config);
    });
  });
});
