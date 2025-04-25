import { describe, it, expect, beforeEach } from "vitest";
import { getDefaultFieldProps, createIframeFieldConfig, cleanObject, filterObject, deepMerge } from "@/utils";
import { createBrandedId, generateTimestampedId } from "@/utils/uuid.js";
import type { FieldName, FormConfig, FormId, PaymentInstrumentType, Placeholder, StylesConfig, FontConfig, FormType, AvailableFieldNames, IframeFieldConfig } from "@/types";
import { CARD_FORM_FIELDS, BANK_FORM_FIELDS, ADDRESS_FORM_FIELDS } from "@/constants";

// --- Add local constants for field names ---
const CardField = {
  NAME: "name",
  NUMBER: "number",
  EXPIRATION_DATE: "expiration_date",
  SECURITY_CODE: "security_code",
} as const;

const BankField = {
  NAME: "name",
  ACCOUNT_NUMBER: "account_number",
  BANK_CODE: "bank_code",
  ACCOUNT_TYPE: "account_type",
  TRANSIT_NUMBER: "transit_number",
  INSTITUTION_NUMBER: "institution_number",
} as const;

const AddressField = {
  ADDRESS_LINE1: "address_line1",
  ADDRESS_LINE2: "address_line2",
  ADDRESS_CITY: "address_city",
  ADDRESS_STATE: "address_state",
  ADDRESS_REGION: "address_region",
  ADDRESS_COUNTRY: "address_country",
  ADDRESS_POSTAL_CODE: "address_postal_code",
} as const;
// --- End local constants ---

// Mocks
const mockFormId = "form-123" as FormId;
const mockBaseCardConfig: FormConfig<"card"> = {
  paymentType: "card",
};
const mockBaseBankConfig: FormConfig<"bank"> = {
  paymentType: "bank",
};

describe("Utility Functions", () => {
  describe("getDefaultFieldProps", () => {
    it("should return correct default props for card fields", () => {
      const numberProps = getDefaultFieldProps(CardField.NUMBER);
      expect(numberProps.defaultLabel).toBe("Card Number");
      const numberConst = CARD_FORM_FIELDS.find((f) => f.id === CardField.NUMBER);
      expect(numberProps.autoComplete).toBe(numberConst?.autoComplete || "cc-number");
      expect(numberProps.validation).toBe(numberConst?.validation);
      expect(numberProps.defaultPlaceholder?.text).toBe(numberConst?.placeholder?.text || "4111 1111 1111 1111");

      const expProps = getDefaultFieldProps(CardField.EXPIRATION_DATE);
      const expConst = CARD_FORM_FIELDS.find((f) => f.id === CardField.EXPIRATION_DATE);
      expect(expProps.defaultLabel).toBe("Expiration");
      expect(expProps.autoComplete).toBe(expConst?.autoComplete || "cc-exp");
      expect(expProps.validation).toBe(expConst?.validation);
      expect(expProps.defaultPlaceholder?.text).toBe(expConst?.placeholder?.text || "MM/YYYY");

      const cvvProps = getDefaultFieldProps(CardField.SECURITY_CODE);
      const cvvConst = CARD_FORM_FIELDS.find((f) => f.id === CardField.SECURITY_CODE);
      expect(cvvProps.defaultLabel).toBe("CVV");
      expect(cvvProps.autoComplete).toBe(cvvConst?.autoComplete || "cc-csc");
      expect(cvvProps.validation).toBe(cvvConst?.validation);
      expect(cvvProps.defaultPlaceholder?.text).toBe(cvvConst?.placeholder?.text || "CVV");

      // Shared 'name' field
      const nameProps = getDefaultFieldProps(CardField.NAME);
      const nameConstCard = CARD_FORM_FIELDS.find((f) => f.id === CardField.NAME);
      const nameConstBank = BANK_FORM_FIELDS.find((f) => f.id === BankField.NAME);
      expect(nameProps.defaultLabel).toBe("Name");
      expect(nameProps.autoComplete).toBe(nameConstBank?.autoComplete || "name");
      expect(nameProps.validation).toBe(nameConstBank?.validation || "required");
      expect(nameProps.defaultPlaceholder?.text).toBe(nameConstBank?.placeholder?.text);
    });

    it("should return correct default props for bank fields", () => {
      const accNumProps = getDefaultFieldProps(BankField.ACCOUNT_NUMBER);
      const accNumConst = BANK_FORM_FIELDS.find((f) => f.id === BankField.ACCOUNT_NUMBER);
      expect(accNumProps.defaultLabel).toBe("Account number");
      expect(accNumProps.autoComplete).toBe(accNumConst?.autoComplete || "account-number");
      expect(accNumProps.validation).toBe(accNumConst?.validation || "required");
      expect(accNumProps.defaultPlaceholder?.text).toBe(accNumConst?.placeholder?.text);

      const routingProps = getDefaultFieldProps(BankField.BANK_CODE);
      const routingConst = BANK_FORM_FIELDS.find((f) => f.id === BankField.BANK_CODE);
      expect(routingProps.defaultLabel).toBe("Routing number");
      expect(routingProps.autoComplete).toBe(routingConst?.autoComplete || "routing-number");
      expect(routingProps.validation).toBe(routingConst?.validation || "required");
      expect(routingProps.defaultPlaceholder?.text).toBe(routingConst?.placeholder?.text);

      const accTypeProps = getDefaultFieldProps(BankField.ACCOUNT_TYPE);
      const accTypeConst = BANK_FORM_FIELDS.find((f) => f.id === BankField.ACCOUNT_TYPE);
      expect(accTypeProps.defaultLabel).toBe("Account type");
      expect(accTypeProps.autoComplete).toBe(accTypeConst?.autoComplete || "account-type");
      expect(accTypeProps.validation).toBe(accTypeConst?.validation || "required");
      expect(accTypeProps.defaultPlaceholder?.text).toBe(accTypeConst?.placeholder?.text);

      // These fields are not typically in BANK_FORM_FIELDS, expect undefined labels
      expect(getDefaultFieldProps(BankField.TRANSIT_NUMBER).defaultLabel).toBeUndefined();
      expect(getDefaultFieldProps(BankField.INSTITUTION_NUMBER).defaultLabel).toBeUndefined();

      // Shared 'name' field - should get BANK field defaults
      const nameProps = getDefaultFieldProps(BankField.NAME);
      const nameConstBank = BANK_FORM_FIELDS.find((f) => f.id === BankField.NAME);
      expect(nameProps.defaultLabel).toBe("Name");
      expect(nameProps.autoComplete).toBe(nameConstBank?.autoComplete || "name"); // Default is 'name' for bank
      expect(nameProps.validation).toBe(nameConstBank?.validation || "required");
      expect(nameProps.defaultPlaceholder?.text).toBe(nameConstBank?.placeholder?.text);
    });

    it("should return correct default props for address fields", () => {
      const line1Props = getDefaultFieldProps(AddressField.ADDRESS_LINE1);
      const line1Const = ADDRESS_FORM_FIELDS.find((f) => f.id === AddressField.ADDRESS_LINE1);
      expect(line1Props.defaultLabel).toBe("Address Line 1");
      expect(line1Props.autoComplete).toBe(line1Const?.autoComplete || "address-line1");
      expect(line1Props.validation).toBe(line1Const?.validation);
      expect(line1Props.defaultPlaceholder?.text).toBe(line1Const?.placeholder?.text);

      const line2Props = getDefaultFieldProps(AddressField.ADDRESS_LINE2);
      const line2Const = ADDRESS_FORM_FIELDS.find((f) => f.id === AddressField.ADDRESS_LINE2);
      expect(line2Props.defaultLabel).toBe("Address Line 2");
      expect(line2Props.autoComplete).toBe(line2Const?.autoComplete || "address-line2");
      expect(line2Props.validation).toBe(line2Const?.validation);
      expect(line2Props.defaultPlaceholder?.text).toBe(line2Const?.placeholder?.text);

      const cityProps = getDefaultFieldProps(AddressField.ADDRESS_CITY);
      const cityConst = ADDRESS_FORM_FIELDS.find((f) => f.id === AddressField.ADDRESS_CITY);
      expect(cityProps.defaultLabel).toBe("City");
      expect(cityProps.validation).toBe(cityConst?.validation);

      const stateProps = getDefaultFieldProps(AddressField.ADDRESS_STATE);
      const stateConst = ADDRESS_FORM_FIELDS.find((f) => f.id === AddressField.ADDRESS_STATE);
      expect(stateProps.defaultLabel).toBe("State");
      expect(stateProps.validation).toBe(stateConst?.validation);

      const regionProps = getDefaultFieldProps(AddressField.ADDRESS_REGION);
      expect(regionProps.defaultLabel).toBe("Region");
      expect(regionProps.autoComplete).toBe("address-level1"); // Default autocomplete for region
      expect(regionProps.validation).toBe(""); // Check for empty string instead of undefined
      expect(regionProps.defaultPlaceholder?.text).toBe("Region"); // Check for the actual placeholder text

      const postalProps = getDefaultFieldProps(AddressField.ADDRESS_POSTAL_CODE);
      const postalConst = ADDRESS_FORM_FIELDS.find((f) => f.id === AddressField.ADDRESS_POSTAL_CODE);
      expect(postalProps.defaultLabel).toBe("Postal code");
      expect(postalProps.validation).toBe(postalConst?.validation);

      const countryProps = getDefaultFieldProps(AddressField.ADDRESS_COUNTRY);
      const countryConst = ADDRESS_FORM_FIELDS.find((f) => f.id === AddressField.ADDRESS_COUNTRY);
      expect(countryProps.defaultLabel).toBe("Country");
      expect(countryProps.validation).toBe(countryConst?.validation);
    });

    it("should return undefined for unknown fields", () => {
      const props = getDefaultFieldProps("unknown_field" as FieldName);
      expect(props.defaultLabel).toBeUndefined();
      expect(props.autoComplete).toBeUndefined();
      expect(props.validation).toBeUndefined();
      expect(props.defaultPlaceholder).toBeUndefined();
    });
  });

  // --- Tests for createIframeFieldConfig ---
  describe("createIframeFieldConfig", () => {
    const paymentTypeCard: PaymentInstrumentType<"card"> = "PAYMENT_CARD";
    const paymentTypeBank: PaymentInstrumentType<"bank"> = "BANK_ACCOUNT";

    it("should create basic card config using actual defaults", () => {
      const config = createIframeFieldConfig(CardField.NUMBER, mockFormId, mockBaseCardConfig, paymentTypeCard);
      const numberDefaults = getDefaultFieldProps(CardField.NUMBER);
      const expectedConfig: Partial<IframeFieldConfig> = {
        formId: mockFormId,
        type: CardField.NUMBER,
        paymentInstrumentType: paymentTypeCard,
        autoComplete: numberDefaults.autoComplete,
      };
      // Conditionally add properties ONLY if they exist in defaults
      if (numberDefaults.validation) expectedConfig.validations = numberDefaults.validation;
      if (numberDefaults.defaultPlaceholder) expectedConfig.placeholder = numberDefaults.defaultPlaceholder;
      expect(config).toEqual(expectedConfig);
    });

    it("should create basic bank config using actual defaults", () => {
      const config = createIframeFieldConfig(BankField.ACCOUNT_NUMBER, mockFormId, mockBaseBankConfig, paymentTypeBank);
      const accNumDefaults = getDefaultFieldProps(BankField.ACCOUNT_NUMBER);
      const expectedConfig: Partial<IframeFieldConfig> = {
        formId: mockFormId,
        type: BankField.ACCOUNT_NUMBER,
        paymentInstrumentType: paymentTypeBank,
        autoComplete: accNumDefaults.autoComplete,
        validations: accNumDefaults.validation, // Bank Acc Num has default validation
      };
      if (accNumDefaults.defaultPlaceholder) expectedConfig.placeholder = accNumDefaults.defaultPlaceholder;
      expect(config).toEqual(expectedConfig);
    });

    it("should prioritize config placeholders over defaults", () => {
      const customPlaceholder = { text: "Enter Card Number" };
      const configWithPlaceholder: FormConfig<"card", false, false, true, false> = {
        ...mockBaseCardConfig,
        showPlaceholders: true,
        placeholders: { [CardField.NUMBER]: customPlaceholder },
      };
      const config = createIframeFieldConfig(CardField.NUMBER, mockFormId, configWithPlaceholder, paymentTypeCard);
      expect(config.placeholder).toEqual(customPlaceholder);
    });

    it("should not include placeholder if showPlaceholders is false", () => {
      const configNoShow: FormConfig<"card", false, false, false> = {
        ...mockBaseCardConfig,
        showPlaceholders: false,
      };
      const config = createIframeFieldConfig(CardField.NUMBER, mockFormId, configNoShow, paymentTypeCard);
      expect(config.placeholder).toBeUndefined();
    });

    it("should include config defaultValues", () => {
      const configWithDefaults: FormConfig<"card"> = {
        ...mockBaseCardConfig,
        defaultValues: { [CardField.NAME]: "Test User" },
      };
      const config = createIframeFieldConfig(CardField.NAME, mockFormId, configWithDefaults, paymentTypeCard);
      expect(config.defaultValue).toBe("Test User");
      expect(config.type).toBe(CardField.NAME);
    });

    it("should include config errorMessages if not hidden", () => {
      const configWithErrors: FormConfig<"card", false, false, false, false> = {
        ...mockBaseCardConfig,
        hideErrorMessages: false,
        errorMessages: { [CardField.NUMBER]: "Invalid Card" },
      };
      const config = createIframeFieldConfig(CardField.NUMBER, mockFormId, configWithErrors, paymentTypeCard);
      expect(config.errorMessage).toBe("Invalid Card");
    });

    it("should not include errorMessages if hidden", () => {
      const configHiddenErrors: FormConfig<"card", false, false, false, true> = {
        ...mockBaseCardConfig,
        hideErrorMessages: true,
        errorMessages: undefined, // Explicitly set to undefined to match 'never' type
      };
      const config = createIframeFieldConfig(CardField.NUMBER, mockFormId, configHiddenErrors, paymentTypeCard);
      expect(config.errorMessage).toBeUndefined();
    });

    it("should include styles and fonts from config", () => {
      const styles: StylesConfig = { default: { color: "blue" } };
      const fonts: FontConfig[] = [{ fontFamily: "Arial", url: "", format: "woff" as const }];
      const configWithStyles: FormConfig<"card"> = {
        ...mockBaseCardConfig,
        styles: styles,
        fonts: fonts,
      };
      const config = createIframeFieldConfig(CardField.NUMBER, mockFormId, configWithStyles, paymentTypeCard);
      expect(config.styles).toEqual(styles);
      expect(config.fonts).toEqual(fonts);
    });

    it("should remove undefined properties from the final config for name field", () => {
      // Test with 'name' which often has fewer defaults
      const config = createIframeFieldConfig(CardField.NAME, mockFormId, mockBaseCardConfig, paymentTypeCard);
      const nameDefaults = getDefaultFieldProps(CardField.NAME);
      const expectedConfig: Partial<IframeFieldConfig> = {
        formId: mockFormId,
        type: CardField.NAME,
        paymentInstrumentType: paymentTypeCard,
        autoComplete: nameDefaults.autoComplete, // Name has default autoComplete
      };
      // Conditionally add validation/placeholder if they exist for name
      if (nameDefaults.validation) expectedConfig.validations = nameDefaults.validation;
      if (nameDefaults.defaultPlaceholder) expectedConfig.placeholder = nameDefaults.defaultPlaceholder;

      expect(config).toEqual(expectedConfig);
      // Explicitly check potentially undefined keys are not present if not added above
      if (!expectedConfig.validations) expect(config).not.toHaveProperty("validations");
      if (!expectedConfig.placeholder) expect(config).not.toHaveProperty("placeholder");
      expect(config).not.toHaveProperty("defaultValue");
      expect(config).not.toHaveProperty("errorMessage");
    });

    it("should correctly merge complex config overrides", () => {
      const complexConfig: FormConfig<"card", true, true, true, false> = {
        paymentType: "card",
        showAddress: true,
        showLabels: true,
        showPlaceholders: true,
        hideErrorMessages: false,
        hideFields: [AddressField.ADDRESS_LINE2],
        requiredFields: [AddressField.ADDRESS_LINE1],
        defaultValues: {
          [CardField.NAME]: "Default Name",
          [AddressField.ADDRESS_COUNTRY]: "CAN",
        },
        labels: {
          [CardField.NUMBER]: "Custom Card Number Label",
        },
        placeholders: {
          [CardField.EXPIRATION_DATE]: "MM/AAAA",
          [AddressField.ADDRESS_POSTAL_CODE]: "Code Postal",
        },
        errorMessages: {
          [CardField.SECURITY_CODE]: "Code de sécurité invalide",
        },
        styles: { default: { fontSize: "18px" } },
        fonts: [{ fontFamily: "Roboto", url: "/fonts/roboto.woff2", format: "woff2" }],
      };

      // Test card number - uses default validation, autoComplete, custom placeholder from defaults
      const numberConfig = createIframeFieldConfig(CardField.NUMBER, mockFormId, complexConfig, paymentTypeCard);
      const numberDefaults = getDefaultFieldProps(CardField.NUMBER);
      expect(numberConfig.validations).toBeUndefined();
      expect(numberConfig.autoComplete).toBe(numberDefaults.autoComplete);
      expect(numberConfig.placeholder).toEqual(numberDefaults.defaultPlaceholder); // Overrides are not for 'number'
      expect(numberConfig.styles).toEqual(complexConfig.styles);
      expect(numberConfig.fonts).toEqual(complexConfig.fonts);
      expect(numberConfig.defaultValue).toBeUndefined();
      expect(numberConfig.errorMessage).toBeUndefined();

      // Test expiration date - uses custom placeholder
      const expConfig = createIframeFieldConfig(CardField.EXPIRATION_DATE, mockFormId, complexConfig, paymentTypeCard);
      expect(expConfig.placeholder).toBe("MM/AAAA");

      // Test security code - uses custom error message
      const cvvConfig = createIframeFieldConfig(CardField.SECURITY_CODE, mockFormId, complexConfig, paymentTypeCard);
      expect(cvvConfig.errorMessage).toBe("Code de sécurité invalide");

      // Test name - uses default value
      const nameConfig = createIframeFieldConfig(CardField.NAME, mockFormId, complexConfig, paymentTypeCard);
      expect(nameConfig.defaultValue).toBe("Default Name");

      // Test postal code - uses custom placeholder, default validation/autocomplete
      const postalConfig = createIframeFieldConfig(AddressField.ADDRESS_POSTAL_CODE, mockFormId, complexConfig, paymentTypeCard);
      const postalDefaults = getDefaultFieldProps(AddressField.ADDRESS_POSTAL_CODE);
      expect(postalConfig.placeholder).toBe("Code Postal");
      expect(postalConfig.validations).toBeUndefined();
      expect(postalConfig.autoComplete).toBe(postalDefaults.autoComplete);
    });
  });

  // --- Tests for createBrandedId ---
  describe("createBrandedId", () => {
    it("should return a string", () => {
      const id = createBrandedId<FormId>(generateTimestampedId("test-"));
      expect(typeof id).toBe("string");
    });

    // Note: Branding is purely a compile-time TypeScript feature.
    // The runtime output is just the input string.
    it("should return the underlying generated ID", () => {
      const rawId = generateTimestampedId("prefix-");
      const brandedId = createBrandedId<FormId>(rawId);
      expect(brandedId).toBe(rawId);
    });
  });

  // --- Tests for generateTimestampedId ---
  describe("generateTimestampedId", () => {
    it("should return a string starting with the prefix", () => {
      const prefix = "my-prefix-";
      const id = generateTimestampedId(prefix);
      expect(typeof id).toBe("string");
      expect(id.startsWith(prefix)).toBe(true);
    });

    it("should include a timestamp component followed by random string", () => {
      const prefix = "ts-";
      const id = generateTimestampedId(prefix);
      // Updated regex to match timestamp-randomstring format
      expect(id).toMatch(/^ts-\d{13,}-[a-z0-9]+$/);
    });

    it("should generate unique IDs on subsequent calls", () => {
      const id1 = generateTimestampedId("unique-");
      // Need a slight delay to ensure timestamp changes
      setTimeout(() => {
        const id2 = generateTimestampedId("unique-");
        expect(id1).not.toBe(id2);
      }, 10); // 10ms delay should be sufficient
    });
  });

  // --- Tests for Object Utilities ---
  describe("Object Utilities", () => {
    describe("cleanObject", () => {
      it("should remove undefined properties", () => {
        const dirty = { a: 1, b: undefined, c: "hello", d: null };
        const cleaned = cleanObject(dirty);
        expect(cleaned).toEqual({ a: 1, c: "hello", d: null }); // null is preserved
        expect(cleaned).not.toHaveProperty("b");
      });

      it("should return the input if not an object", () => {
        expect(cleanObject(null as any)).toBeNull();
        expect(cleanObject(undefined as any)).toBeUndefined();
        expect(cleanObject(123 as any)).toBe(123);
        expect(cleanObject("test" as any)).toBe("test");
      });

      it("should handle empty objects", () => {
        expect(cleanObject({})).toEqual({});
      });

      it("should handle objects with only undefined values", () => {
        expect(cleanObject({ a: undefined, b: undefined })).toEqual({});
      });
    });

    describe("filterObject", () => {
      const obj = { a: 1, b: "two", c: 3, d: "four" };

      it("should filter based on value type", () => {
        const isNumber = (val: unknown) => typeof val === "number";
        expect(filterObject(obj, isNumber)).toEqual({ a: 1, c: 3 });
      });

      it("should filter based on key", () => {
        const keyStartsWithA = (_val: unknown, key: string) => key.startsWith("a");
        expect(filterObject(obj, keyStartsWithA)).toEqual({ a: 1 });
      });

      it("should return empty object if no properties match", () => {
        const isBoolean = (val: unknown) => typeof val === "boolean";
        expect(filterObject(obj, isBoolean)).toEqual({});
      });

      it("should return the input if not an object", () => {
        const predicate = () => true;
        expect(filterObject(null as any, predicate)).toBeNull();
        expect(filterObject(undefined as any, predicate)).toBeUndefined();
      });
    });

    describe("deepMerge", () => {
      it("should merge simple objects", () => {
        const target: Record<string, any> = { a: 1 };
        const source: Record<string, any> = { b: 2 };
        const expected: Record<string, any> = { a: 1, b: 2 };
        expect(deepMerge(target, source)).toEqual(expected);
        expect(target).toEqual({ a: 1 }); // Ensure target is not mutated
      });

      it("should overwrite existing properties", () => {
        const target: Record<string, any> = { a: 1, b: 1 };
        const source: Record<string, any> = { b: 2 };
        const expected: Record<string, any> = { a: 1, b: 2 };
        expect(deepMerge(target, source)).toEqual(expected);
      });

      it("should merge nested objects", () => {
        const target: Record<string, any> = { a: 1, nested: { x: 10 } };
        const source: Record<string, any> = { b: 2, nested: { y: 20 } };
        const expected: Record<string, any> = { a: 1, b: 2, nested: { x: 10, y: 20 } };
        expect(deepMerge(target, source)).toEqual(expected);
      });

      it("should overwrite nested properties", () => {
        const target: Record<string, any> = { nested: { x: 10, y: 10 } };
        const source: Record<string, any> = { nested: { y: 20 } };
        const expected: Record<string, any> = { nested: { x: 10, y: 20 } };
        expect(deepMerge(target, source)).toEqual(expected);
      });

      it("should handle multiple sources", () => {
        const target: Record<string, any> = { a: 1 };
        const source1: Record<string, any> = { b: 2 };
        const source2: Record<string, any> = { c: 3, a: 0 }; // Overwrites target.a
        const expected: Record<string, any> = { a: 0, b: 2, c: 3 };
        expect(deepMerge(target, source1, source2)).toEqual(expected);
      });
    });
  });
  // --- End Tests for Object Utilities ---
});
