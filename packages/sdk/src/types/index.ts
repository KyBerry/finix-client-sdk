import { ADDRESS_FORM_FIELDS, BANK_FORM_FIELDS, CARD_FORM_FIELDS, FINIX_ENVIRONMENT } from "@/constants";
import type { Properties } from "csstype";

// -------------------------------------------------------------------------
// Core Types
// -------------------------------------------------------------------------
export type FormType = "bank" | "card" | "token";
export type FormId = string & { __brand: "FormId" };

export type MessageType = "field-updated" | "form-submit" | "bin-information-received" | "response-received" | "response-error" | "submit";

export type FontFormat = "woff" | "woff2" | "ttf" | "otf" | "eot";
export type FinixEnvironment = (typeof FINIX_ENVIRONMENT)[keyof typeof FINIX_ENVIRONMENT];

// -------------------------------------------------------------------------
// Field Names
// -------------------------------------------------------------------------
export type CardFieldName = "name" | "number" | "expiration_date" | "security_code";
export type BankFieldName = "name" | "account_number" | "bank_code" | "account_type";
export type AddressFieldName = "address_line1" | "address_line2" | "address_city" | "address_state" | "address_region" | "address_country" | "address_postal_code";

export type FieldName = CardFieldName | BankFieldName | AddressFieldName;

// -------------------------------------------------------------------------
// Configuration Types
// -------------------------------------------------------------------------
export interface EnvironmentConfig {
  readonly environment: FinixEnvironment;
  readonly applicationId: string;
  readonly merchantId: string;
  fraudSessionId?: string;
  readonly enableFraudDetection?: boolean;
}

// -------------------------------------------------------------------------
// Conditional Field Type Selection
// -------------------------------------------------------------------------

// Define base field maps for each form type
type BaseFieldMap = {
  bank: BankFieldName;
  card: CardFieldName;
  token: CardFieldName | BankFieldName;
};

export type BankFieldMap = {
  [K in AvailableFieldNames<"bank">]: FieldState;
};

// Fields that are always required and cannot be in requiredFields
export type AlwaysRequiredFields<T extends FormType> = T extends "bank" ? "account_number" | "bank_code" | "account_type" : T extends "card" ? "number" | "expiration_date" | "security_code" : never;

// Fields that cannot be hidden
export type NonHideableFields<T extends FormType> = T extends "bank" ? "account_number" | "bank_code" | "account_type" : T extends "card" ? "number" | "expiration_date" : never;

// Fields that don't support default values
export type NonDefaultableFields<T extends FormType> = T extends "bank" ? "account_number" : T extends "card" ? "number" | "expiration_date" : T extends "token" ? "number" | "expiration_date" | "security_code" | "account_number" : never;

// Determine available field names based on form type and showAddress option
export type AvailableFieldNames<T extends FormType, ShowAddress extends boolean = false> = BaseFieldMap[T] | (ShowAddress extends true ? AddressFieldName : never);

// Fields that can be hidden
export type HideableField<T extends FormType, ShowAddress extends boolean = false> = Exclude<AvailableFieldNames<T, ShowAddress>, NonHideableFields<T>>;

// Fields that can be set as required (not always required)
export type ConfigurableRequiredField<T extends FormType, ShowAddress extends boolean = false> = Exclude<AvailableFieldNames<T, ShowAddress>, AlwaysRequiredFields<T>>;

// Fields that can have default values
export type DefaultableField<T extends FormType, ShowAddress extends boolean = false> = Exclude<AvailableFieldNames<T, ShowAddress>, NonDefaultableFields<T>>;

// -------------------------------------------------------------------------
// Form Configuration with Conditional Types
// -------------------------------------------------------------------------
export type FormConfig<T extends FormType, ShowAddress extends boolean = false, ShowLabels extends boolean = false, ShowPlaceholders extends boolean = false, HideErrorMessages extends boolean = false> = {
  paymentType: T;
  showAddress?: ShowAddress;
  showLabels?: ShowLabels;
  showPlaceholders?: ShowPlaceholders;
  hideErrorMessages?: HideErrorMessages;
  hideFields?: HideableField<T, ShowAddress>[];
  requiredFields?: ConfigurableRequiredField<T, ShowAddress>[];
  defaultValues?: Partial<Record<DefaultableField<T, ShowAddress>, string>>;
  labels?: ShowLabels extends true ? Partial<Record<AvailableFieldNames<T, ShowAddress>, string>> : never;
  placeholders?: ShowPlaceholders extends true ? Partial<Record<AvailableFieldNames<T, ShowAddress>, string | Placeholder>> : never;
  errorMessages?: HideErrorMessages extends true ? never : Partial<Record<AvailableFieldNames<T, ShowAddress>, string>>;
  styles?: StylesConfig;
  fonts?: FontConfig[];
  submitLabel?: string;
  callbacks?: FormCallbacks;
};

// -------------------------------------------------------------------------
// Supporting Types
// -------------------------------------------------------------------------
export interface IframeMessage<T = unknown> {
  readonly messageId?: string;
  readonly messageName: MessageType;
  readonly formId: string;
  readonly messageData: T;
}

export interface FinixTokenResponse {
  readonly data?: {
    readonly id: string;
    readonly [key: string]: unknown;
  };
  readonly [key: string]: unknown;
}

export interface FieldState {
  isDirty: boolean;
  isFocused: boolean;
  errorMessages: string[];
  selected?: string;
}

export type FormState<TFormType extends FormType = FormType, ShowAddress extends boolean = false> = Partial<Record<AvailableFieldNames<TFormType, ShowAddress>, FieldState>>;

// -------------------------------------------------------------------------
// Payment Instrument Type
// -------------------------------------------------------------------------
type PaymentInstrumentTypeMap = {
  bank: "BANK_ACCOUNT";
  card: "PAYMENT_CARD";
  token: "PAYMENT_CARD" | "BANK_ACCOUNT";
};

export type PaymentInstrumentType<T extends FormType = FormType> = PaymentInstrumentTypeMap[T];

// -------------------------------------------------------------------------
// Style Types
// -------------------------------------------------------------------------
export type StylesConfig = {
  default?: Properties<string | number>;
  success?: Properties<string | number>;
  error?: Properties<string | number>;
};

export interface FontConfig {
  readonly fontFamily: string;
  readonly url: string;
  readonly format: FontFormat;
}

export interface Placeholder {
  readonly text: string;
  readonly hideOnFocus?: boolean;
}

// -------------------------------------------------------------------------
// Callback Types
// -------------------------------------------------------------------------
export type FormCallbacks = {
  onUpdate?: (state: FormState, binInformation: unknown, formHasErrors: boolean) => void;
  onLoad?: () => void;
  onSubmit?: (event: unknown) => void;
  onValidationError?: (fieldName: FieldName, errors: readonly string[]) => void;
  onTokenize?: (token: string) => void;
  onTokenizeError?: (error: unknown) => void;
};

// -------------------------------------------------------------------------
// Form Field Types
// -------------------------------------------------------------------------
export type BaseFieldConfig = {
  readonly validations?: string;
  readonly autoComplete?: string;
  readonly styles?: StylesConfig;
  readonly fonts?: readonly FontConfig[];
};

export type FormFieldMap<T extends FormType, ShowAddress extends boolean = false> = {
  [K in AvailableFieldNames<T, ShowAddress>]: Readonly<
    BaseFieldConfig & {
      formId: string;
      type: K;
      paymentInstrumentType: PaymentInstrumentType<T>;
      labelText?: string;
      placeholder?: Placeholder;
      errorMessage?: string;
    } & (K extends NonDefaultableFields<T> ? {} : { defaultValue?: string }) &
      (K extends AlwaysRequiredFields<T> ? { required: true } : { required?: boolean })
  >;
};

export type FormField<T extends FormType, ShowAddress extends boolean = false> = FormFieldMap<T, ShowAddress>[keyof FormFieldMap<T, ShowAddress>];

// -------------------------------------------------------------------------
// Form Creation API
// -------------------------------------------------------------------------

/**
 * Creates a strongly-typed form with the provided configuration
 * @param config Configuration options for the form
 */
export function createForm<T extends FormType, ShowAddress extends boolean = false, ShowLabels extends boolean = false, ShowPlaceholders extends boolean = false, HideErrorMessages extends boolean = false>(
  config: FormConfig<T, ShowAddress, ShowLabels, ShowPlaceholders, HideErrorMessages>,
): {
  id: FormId;
  // Additional form methods would go here
} {
  // Implementation details
  return { id: "" as FormId };
}

// Helper function to create test form fields with strong typing
export function createTypedField<T extends FormType, ShowAddress extends boolean = false>(field: FormField<T, ShowAddress>): FormField<T, ShowAddress> {
  return field;
}

export function getAvailableFields<T extends FormType>(type: T, showAddress: boolean): AvailableFieldNames<T, true>[] {
  const baseFields = type === "card" ? CARD_FORM_FIELDS.map((f) => f.id) : type === "bank" ? BANK_FORM_FIELDS.map((f) => f.id) : [...CARD_FORM_FIELDS, ...BANK_FORM_FIELDS].map((f) => f.id);

  const addressFields = showAddress ? ADDRESS_FORM_FIELDS.map((f) => f.id) : [];

  return [...baseFields, ...addressFields] as AvailableFieldNames<T, true>[];
}

export function getVisibleFields<T extends FormType>(config: {
  paymentType: T;
  hideFields?: HideableField<T, true>[]; // ShowAddress = true for max hideable scope
  showAddress?: boolean;
}): AvailableFieldNames<T, true>[] {
  const showAddress = config.showAddress === true;
  const allFields = getAvailableFields(config.paymentType, showAddress);

  const validHideableFields = new Set<HideableField<T, true>>((config.hideFields ?? []).filter((field) => allFields.includes(field)) as HideableField<T, true>[]);

  return allFields.filter((field) => !validHideableFields.has(field as HideableField<T, true>));
}
