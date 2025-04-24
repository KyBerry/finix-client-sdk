export * from "./object";
export * from "./uuid";

import { ADDRESS_FORM_FIELDS, BANK_FORM_FIELDS, CARD_FORM_FIELDS } from "@/constants";

import type { FieldName, FormConfig, FormId, Placeholder, FormType, PaymentInstrumentType, AvailableFieldNames, DefaultableField, AddressFieldName, BankFieldName, CardFieldName, StylesConfig, FontConfig } from "@/types";

// Define the structure of the object sent to the iframe
// Based on analysis of finix.js fieldConfig
interface IframeFieldConfig {
  formId: FormId;
  type: FieldName;
  paymentInstrumentType: PaymentInstrumentType<FormType>; // Generic FormType here
  styles?: StylesConfig;
  placeholder?: string | Placeholder;
  validations?: string;
  autoComplete?: string;
  errorMessage?: string;
  fonts?: FontConfig[];
  defaultValue?: string;
  // options?: unknown; // Not currently used in our types
  // defaultOption?: unknown; // Not currently used in our types
}

// Helper to get the default properties (like autoComplete, validation) for a field
function getDefaultFieldProps(fieldName: FieldName): { autoComplete?: string; validation?: string; defaultPlaceholder?: Placeholder } {
  const allDefaults = [...CARD_FORM_FIELDS, ...BANK_FORM_FIELDS, ...ADDRESS_FORM_FIELDS];
  const props = allDefaults.find((f) => f.id === fieldName);
  return {
    autoComplete: props?.autoComplete,
    validation: props?.validation,
    defaultPlaceholder: props?.placeholder,
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
export function createIframeFieldConfig<T extends FormType, ShowAddress extends boolean>(fieldName: AvailableFieldNames<T, ShowAddress>, formId: FormId, config: FormConfig<T, ShowAddress>, paymentType: PaymentInstrumentType<T>): IframeFieldConfig {
  const defaults = getDefaultFieldProps(fieldName);

  // Determine placeholder: Config override > Default constant placeholder
  let placeholder: string | Placeholder | undefined;
  if (config.showPlaceholders && config.placeholders?.[fieldName]) {
    placeholder = config.placeholders[fieldName];
  } else if (defaults.defaultPlaceholder) {
    placeholder = defaults.defaultPlaceholder;
  }

  // Determine default value (only for defaultable fields)
  let defaultValue: string | undefined;
  if (config.defaultValues?.[fieldName as DefaultableField<T, ShowAddress>]) {
    defaultValue = config.defaultValues[fieldName as DefaultableField<T, ShowAddress>];
  }

  // Determine error message (only if not hidden)
  let errorMessage: string | undefined;
  if (!config.hideErrorMessages && config.errorMessages?.[fieldName]) {
    errorMessage = config.errorMessages[fieldName];
  }

  const fieldConfig: IframeFieldConfig = {
    // Static values
    formId: formId,
    type: fieldName,
    paymentInstrumentType: paymentType,

    // Default values from constants
    autoComplete: defaults.autoComplete,
    validations: defaults.validation,

    // Resolved values (Config > Defaults)
    placeholder: placeholder,
    defaultValue: defaultValue,
    errorMessage: errorMessage,

    // Direct values from FormConfig
    styles: config.styles,
    fonts: config.fonts,
  };

  // Clean the object: Remove keys with undefined values (similar to finix.js 'c' function)
  Object.keys(fieldConfig).forEach((key) => {
    const typedKey = key as keyof IframeFieldConfig;
    if (fieldConfig[typedKey] === undefined) {
      delete fieldConfig[typedKey];
    }
  });

  return fieldConfig;
}
