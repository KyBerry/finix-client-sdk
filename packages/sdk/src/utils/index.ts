export * from "./object";
export * from "./uuid";

import { ADDRESS_FORM_FIELDS, BANK_FORM_FIELDS, CARD_FORM_FIELDS } from "@/constants";

import type { FieldName, FormConfig, FormId, Placeholder, FormType, PaymentInstrumentType, AvailableFieldNames, DefaultableField, IframeFieldConfig } from "@/types";

// Helper to get the default properties (like autoComplete, validation) for a field
export function getDefaultFieldProps(fieldName: FieldName): {
  autoComplete?: string;
  validation?: string;
  defaultPlaceholder?: Placeholder;
  defaultLabel?: string;
} {
  const allDefaults = [...CARD_FORM_FIELDS, ...BANK_FORM_FIELDS, ...ADDRESS_FORM_FIELDS];
  const props = allDefaults.find((f) => f.id === fieldName);

  // Special case for address_region field
  if (fieldName === "address_region") {
    return {
      autoComplete: "address-level1",
      validation: props?.validation,
      defaultPlaceholder: props?.placeholder,
      defaultLabel: "Region",
    };
  }

  // Special case for "name" field - we need to distinguish between bank and card fields
  if (fieldName === "name") {
    const bankNameField = BANK_FORM_FIELDS.find((f) => f.id === "name");
    const cardNameField = CARD_FORM_FIELDS.find((f) => f.id === "name");

    // Prefer bank defaults ONLY if its validation is specifically 'required'
    if (bankNameField?.validation === "required") {
      return {
        autoComplete: bankNameField.autoComplete,
        validation: bankNameField.validation,
        defaultPlaceholder: bankNameField.placeholder,
        defaultLabel: bankNameField.label,
      };
    }
    // Otherwise (including if bank validation isn't 'required'), return card defaults
    else if (cardNameField) {
      return {
        autoComplete: cardNameField.autoComplete,
        validation: cardNameField.validation,
        defaultPlaceholder: cardNameField.placeholder,
        defaultLabel: cardNameField.label,
      };
    }
    // If neither found (shouldn't happen), fall through to general logic
  }

  return {
    autoComplete: props?.autoComplete,
    validation: props?.validation,
    defaultPlaceholder: props?.placeholder,
    defaultLabel: props?.label,
  };
}

/**
 * Creates the configuration object needed for a specific iframe field.
 * Merges defaults with FormConfig overrides.
 *
 * @param fieldName The specific field being configured.
 * @param formId The ID of the parent form.
 * @param config The overall form configuration.
 * @param paymentType The specific payment instrument type for this form.
 * @returns The configuration object ready to be stringified and encoded.
 */
export function createIframeFieldConfig<
  T extends FormType,
  S extends boolean = boolean, // ShowAddress
  SL extends boolean = boolean, // ShowLabels (added)
  SP extends boolean = boolean, // ShowPlaceholders (added)
  HE extends boolean = boolean, // HideErrorMessages (added)
>(
  fieldName: FieldName,
  formId: FormId,
  config: FormConfig<T, S, SL, SP, HE>, // Use all generics
  paymentType: PaymentInstrumentType<T>,
): IframeFieldConfig {
  const defaults = getDefaultFieldProps(fieldName);
  // Use config values; types are narrowed by generics SP and HE
  const showAddress = config.showAddress ?? false; // S corresponds to this conceptually
  const showPlaceholders = config.showPlaceholders !== false; // Check runtime value
  const hideErrorMessages = config.hideErrorMessages === true; // Check runtime value

  // Determine placeholder: Config override > Default constant placeholder
  let placeholder: string | Placeholder | undefined;
  if (showPlaceholders) {
    // Check runtime value
    const placeholders = config.placeholders; // Type is now correctly narrowed by SP
    if (placeholders && Object.prototype.hasOwnProperty.call(placeholders, fieldName)) {
      // Use hasOwnProperty
      // Index with fieldName, potentially casting fieldName if direct indexing fails
      placeholder = placeholders[fieldName as keyof typeof placeholders];
    } else if (defaults.defaultPlaceholder) {
      placeholder = defaults.defaultPlaceholder;
    }
  }

  // Determine default value (only for defaultable fields)
  let defaultValue: string | undefined;
  const fieldNameAsDefaultable = fieldName as DefaultableField<T, S>; // Depends on T, S
  // Type of config.defaultValues is correctly narrowed
  if (config.defaultValues?.[fieldNameAsDefaultable]) {
    // Direct access should be fine
    defaultValue = config.defaultValues[fieldNameAsDefaultable];
  }

  // Determine error message (only if not hidden)
  let errorMessage: string | undefined;
  if (!hideErrorMessages) {
    // Check runtime value
    const errorMessages = config.errorMessages; // Type is now correctly narrowed by HE
    const fieldNameAsAvailable = fieldName as AvailableFieldNames<T, S>; // Depends on T, S
    // Use hasOwnProperty and check if fieldName is keyof errorMessages
    if (errorMessages && Object.prototype.hasOwnProperty.call(errorMessages, fieldNameAsAvailable)) {
      // Index with fieldName, potentially casting fieldName if direct indexing fails
      errorMessage = errorMessages[fieldNameAsAvailable as keyof typeof errorMessages];
    }
  }

  const fieldConfig: IframeFieldConfig = {
    // Static values
    formId: formId,
    type: fieldName,
    paymentInstrumentType: paymentType,

    // Default values from constants (fieldName independent of T)
    autoComplete: defaults.autoComplete,

    // Only add validations if it actually has a non-empty value
    ...(defaults.validation && defaults.validation !== "" ? { validations: defaults.validation } : {}),

    // Resolved values (Config > Defaults)
    placeholder: placeholder,
    defaultValue: defaultValue,
    errorMessage: errorMessage,

    // Direct values from FormConfig
    styles: config.styles,
    fonts: config.fonts,
  };

  if (fieldName === "address_state") {
    fieldConfig.options = "state";
  } else if (fieldName === "address_country") {
    fieldConfig.options = "country";
    // Set defaultOption for country, allowing override from config.defaultValues
    fieldConfig.defaultOption = defaultValue ?? "USA";
  }

  // Clean the object: Remove keys with undefined values (similar to finix.js 'c' function)
  Object.keys(fieldConfig).forEach((key) => {
    const typedKey = key as keyof IframeFieldConfig;
    if (fieldConfig[typedKey] === undefined) {
      delete fieldConfig[typedKey];
    }
  });

  return fieldConfig;
}
