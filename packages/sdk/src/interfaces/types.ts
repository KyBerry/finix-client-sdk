import { FINIX_ENVIRONMENT } from "@/constants";

import type { Properties } from "csstype";

/**
 * Available form types
 */
export type FormType = "bank" | "card" | "token";

/**
 * Payment instrument types
 */
export type PaymentInstrumentType = "PAYMENT_CARD" | "BANK_ACCOUNT";

/**
 * Supported font formats
 */
export type FontFormat = "woff" | "woff2" | "ttf" | "otf" | "eot";

/**
 * Message types for iframe communication
 */
export type MessageType = "field-updated" | "form-submit" | "bin-information-received" | "response-received" | "response-error" | "submit";

// -------------------------------------------------------------------------
// Field Types
// -------------------------------------------------------------------------

/**
 * Card-related field names
 */
export type CardFieldName = "name" | "number" | "expiration_date" | "security_code";

/**
 * Bank-related field names
 */
export type BankFieldName = "account_number" | "bank_code" | "account_type";

/**
 * Address-related field names using template literals
 */
export type AddressFieldName = `address_${"line1" | "line2" | "city" | "state" | "region" | "country" | "postal_code"}`;

/**
 * Union of all field names
 */
export type FieldName = CardFieldName | BankFieldName | AddressFieldName;

/**
 * Fields that are always required and cannot be in requiredFields option
 */
export type AlwaysRequiredField = "number" | "expiration_date" | "account_number" | "bank_code" | "account_type";

/**
 * Fields that can be required explicitly via requiredFields option
 */
export type OptionallyRequiredField = Exclude<FieldName, AlwaysRequiredField>;

/**
 * Fields that cannot be hidden via hideFields option
 */
export type NonHideableField = AlwaysRequiredField;

/**
 * Fields that can be hidden via hideFields option
 */
export type HideableField = Exclude<FieldName, NonHideableField>;

/**
 * Fields that cannot have default values set
 */
export type NonDefaultableField = "number" | "expiration_date" | "account_number";

/**
 * Fields that can have default values set
 */
export type DefaultableField = Exclude<FieldName, NonDefaultableField>;

/**
 * Get all field names applicable for a form type, including address fields
 */
export type GetFormFieldNames<T extends FormType, HasAddress extends boolean> = HasAddress extends true ? FormTypeToFieldNames<T> | AddressFieldName : FormTypeToFieldNames<T>;

/**
 * Maps a form type to its allowed field names (without address fields)
 */
export type FormTypeToFieldNames<T extends FormType> = T extends "bank" ? BankFieldName : T extends "card" ? CardFieldName : T extends "token" ? BankFieldName | CardFieldName : never;

/**
 * Maps a payment instrument type to its corresponding field names
 */
export type InstrumentTypeToFieldNames<T extends PaymentInstrumentType> = T extends "PAYMENT_CARD" ? CardFieldName : T extends "BANK_ACCOUNT" ? BankFieldName : never;

/**
 * Helper type that maps any type to its corresponding field names
 */
export type MapTypeToFields<T> = T extends FormType ? FormTypeToFieldNames<T> : T extends PaymentInstrumentType ? InstrumentTypeToFieldNames<T> : never;

/**
 * Get form fields with optional address fields based on showAddress setting
 */
export type GetFieldsWithAddress<T extends FormType | PaymentInstrumentType, HasAddress extends boolean> = HasAddress extends true ? MapTypeToFields<T> | AddressFieldName : MapTypeToFields<T>;

/**
 * Extract applicable fields for a form configuration based on form type and address setting
 */
export type ApplicableFields<T extends FormType, HasAddress extends boolean, FieldType extends keyof Pick<FieldFilters, "hideable" | "defaultable" | "optionallyRequired">> = FieldFilters[FieldType] & GetFieldsWithAddress<T, HasAddress>;

// -------------------------------------------------------------------------
// Field Filtering Utilities
// -------------------------------------------------------------------------

/**
 * Utility type that groups different field filtering categories
 */
export type FieldFilters = {
  hideable: HideableField;
  nonHideable: NonHideableField;
  defaultable: DefaultableField;
  nonDefaultable: NonDefaultableField;
  alwaysRequired: AlwaysRequiredField;
  optionallyRequired: OptionallyRequiredField;
};

// -------------------------------------------------------------------------
// Style Types
// -------------------------------------------------------------------------

/**
 * Comprehensive type for CSS style properties
 */
export type StyleOptions = Properties<string | number>;

/**
 * Style configuration for different form states
 */
export type StylesConfig = {
  /** Base styles for all fields */
  default?: StyleOptions;
  /** Styles applied when a field is valid */
  success?: StyleOptions;
  /** Styles applied when a field has errors */
  error?: StyleOptions;
};

// -------------------------------------------------------------------------
// Configuration Types
// -------------------------------------------------------------------------

/**
 * Configuration for custom fonts
 */
export type FontConfig = {
  /** Font family name to reference in CSS */
  fontFamily: string;
  /** HTTPS URL to the font file */
  url: string;
  /** Format of the font file */
  format: FontFormat;
};

/**
 * Placeholder configuration
 */
export type Placeholder = {
  text: string;
  hideOnFocus?: boolean;
};

/**
 * Available finix environments
 */
export type FinixEnvironment = (typeof FINIX_ENVIRONMENT)[keyof typeof FINIX_ENVIRONMENT];

/**
 * Environment configuration
 */
export interface EnvironmentConfig {
  environment: FinixEnvironment;
  applicationId: string;
  merchantId: string;
  fraudSessionId?: string;
  enableFraudDetection?: boolean;
}

// -------------------------------------------------------------------------
// State Types
// -------------------------------------------------------------------------

/**
 * Current state of the form's field values
 */
export type FormState = Record<FieldName, FieldState>;

/**
 * State of an individual field
 */
export type FieldState = {
  isDirty: boolean;
  isFocused: boolean;
  errorMessages: string[];
};

// -------------------------------------------------------------------------
// Response Types
// -------------------------------------------------------------------------

/**
 * Response structure from the Finix API after tokenization
 */
export interface FinixTokenResponse {
  data?: {
    id: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// -------------------------------------------------------------------------
// Form Configuration Types
// -------------------------------------------------------------------------

/**
 * Base form options that are always available
 */
type BaseFormOptions<T extends FormType> = {
  showAddress?: boolean;
  showLabels?: boolean;
  showPlaceholders?: boolean;
  hideErrorMessages?: boolean;
  hideFields?: Array<ApplicableFields<T, true, "hideable">>;
  requiredFields?: Array<ApplicableFields<T, true, "optionallyRequired">>;
  defaultValues?: Partial<Record<ApplicableFields<T, true, "defaultable">, string>>;
  errorMessages?: Partial<Record<FormTypeToFieldNames<T> | AddressFieldName, string>>;
  styles?: StylesConfig;
  fonts?: FontConfig[];
  onUpdate?: (state: FormState, binInformation: any, formHasErrors: boolean) => void;
  onLoad?: () => void;
  onSubmit?: (event: any) => void;
  submitLabel?: string;
};

/**
 * Conditional form option types for label configuration
 */
type LabelOptions<T extends FormType, HasAddress extends boolean> = { showLabels?: true; labels?: Partial<Record<GetFieldsWithAddress<T, HasAddress>, string>> } | { showLabels: false; labels?: never };

/**
 * Conditional form option types for placeholder configuration
 */
type PlaceholderOptions<T extends FormType, HasAddress extends boolean> = { showPlaceholders?: true; placeholders?: Partial<Record<GetFieldsWithAddress<T, HasAddress>, string>> } | { showPlaceholders: false; placeholders?: never };

/**
 * Form options with address fields
 */
type WithAddressOptions<T extends FormType> = {
  showAddress?: true;
} & LabelOptions<T, true> &
  PlaceholderOptions<T, true>;

/**
 * Form options without address fields
 */
type WithoutAddressOptions<T extends FormType> = {
  showAddress: false;
} & LabelOptions<T, false> &
  PlaceholderOptions<T, false>;

/**
 * Complete form options type using discriminated unions for conditional properties
 */
export type FormOptions<T extends FormType> = BaseFormOptions<T> & (WithAddressOptions<T> | WithoutAddressOptions<T>);

// -------------------------------------------------------------------------
// Form Field Types
// -------------------------------------------------------------------------

/**
 * Form field definition
 */
export type FormField<T extends FormType, HasAddress extends boolean = boolean> = {
  formId: string;
  type: GetFormFieldNames<T, HasAddress>;
  paymentInstrumentType: T extends "token" ? PaymentInstrumentType : T extends "bank" ? "BANK_ACCOUNT" : "PAYMENT_CARD";
  styles: StylesConfig;
  placeholder: Placeholder;
  validations?: string;
  autoComplete?: string;
  fonts?: FontConfig[];
};

// -------------------------------------------------------------------------
// Interfaces & Complete Form Types
// -------------------------------------------------------------------------

/**
 * Interface for messages sent between iframes
 */
export interface IframeMessage<T = unknown> {
  readonly messageId?: string;
  readonly messageName: MessageType | string;
  readonly formId: string;
  readonly messageData: T;
}

/**
 * Payment form interface
 */
export interface PaymentForm {
  getFormState(): FormState;
  setFormState(fieldName: FieldName, state: FieldState): void;
  submit(): Promise<FinixTokenResponse>;
  render(containerId: string): void;
}

/**
 * Complete form type
 */
export type Form<T extends FormType> = {
  type: T;
  options: FormOptions<T>;
  fields: Array<FormField<T, boolean>>;
  selectedInstrumentType?: T extends "token" ? PaymentInstrumentType : never;
  getFormState?: () => FormState;
  submit?: () => Promise<FinixTokenResponse>;
};

// -------------------------------------------------------------------------
// Type Guards & Helper Functions
// -------------------------------------------------------------------------

/**
 * Helper function to determine if the form has address fields
 */
export function hasAddressFields<T extends FormType>(options: FormOptions<T>): options is WithAddressOptions<T> {
  return options.showAddress !== false;
}

/**
 * Type guard to check if a form is a token form
 */
export function isTokenForm(form: Form<FormType>): form is Form<"token"> {
  return form.type === "token";
}

/**
 * Type guard to check if a field belongs to the bank form type
 */
export function isBankField(fieldName: FieldName): fieldName is BankFieldName {
  return ["account_number", "bank_code", "account_type"].includes(fieldName as BankFieldName);
}

/**
 * Type guard to check if a field belongs to the card form type
 */
export function isCardField(fieldName: FieldName): fieldName is CardFieldName {
  return ["name", "number", "expiration_date", "security_code"].includes(fieldName as CardFieldName);
}

/**
 * Type guard to check if a field is an address field
 */
export function isAddressField(fieldName: FieldName): fieldName is AddressFieldName {
  return fieldName.startsWith("address_");
}
