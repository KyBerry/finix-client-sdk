import { FINIX_ENVIRONMENT } from "@/constants";
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
export type BankFieldName = "account_number" | "bank_code" | "account_type";
export type AddressFieldName = "address_line1" | "address_line2" | "address_city" | "address_state" | "address_region" | "address_country" | "address_postal_code";

export type FieldName = CardFieldName | BankFieldName | AddressFieldName;

// -------------------------------------------------------------------------
// Configuration Types
// -------------------------------------------------------------------------
export interface EnvironmentConfig {
  readonly environment: FinixEnvironment;
  readonly applicationId: string;
  readonly merchantId: string;
  readonly fraudSessionId?: string;
  readonly enableFraudDetection?: boolean;
}

export type FormConfig<T extends FormType> = {
  paymentType: T;
  showAddress?: boolean;
  showLabels?: boolean;
  showPlaceholders?: boolean;
  hideErrorMessages?: boolean;
  hideFields?: HideableField<T>[];
  requiredFields?: OptionallyRequiredField<T>[];
  defaultValues?: Partial<Record<DefaultableField<T>, string>>;
  labels?: Partial<Record<AllowedFieldNames<T>, string>>;
  placeholders?: Partial<Record<AllowedFieldNames<T>, string | Placeholder>>;
  errorMessages?: Partial<Record<AllowedFieldNames<T>, string>>;
  styles?: StylesConfig;
  fonts?: FontConfig[];
  submitLabel?: string;
  callbacks?: FormCallbacks<T>;
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
  readonly isDirty: boolean;
  readonly isFocused: boolean;
  readonly errorMessages: readonly string[];
}

export type FormState = Readonly<Record<FieldName, FieldState>>;

// -------------------------------------------------------------------------
// Derived Types
// -------------------------------------------------------------------------
type PaymentInstrumentTypeMap = {
  bank: "BANK_ACCOUNT";
  card: "PAYMENT_CARD";
  token: "PAYMENT_CARD" | "BANK_ACCOUNT";
};

export type PaymentInstrumentType<T extends FormType = FormType> = PaymentInstrumentTypeMap[T];

type BaseFieldMap = {
  bank: BankFieldName;
  card: CardFieldName;
  token: CardFieldName | BankFieldName;
};

type AlwaysRequired<T extends FormType> = T extends "bank" ? "account_number" | "bank_code" | "account_type" : T extends "card" ? "number" | "expiration_date" : never;

type AllowedFieldNames<T extends FormType> = BaseFieldMap[T] | (FormConfig<T>["showAddress"] extends true ? AddressFieldName : never);

type HideableField<T extends FormType> = Exclude<AllowedFieldNames<T>, AlwaysRequired<T>>;

type OptionallyRequiredField<T extends FormType> = HideableField<T>;

type DefaultableField<T extends FormType> = Exclude<AllowedFieldNames<T>, T extends "bank" ? "account_number" : T extends "card" ? "number" | "expiration_date" : never>;

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
export type FormCallbacks<T extends FormType> = {
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
type BaseFieldConfig = {
  readonly validations?: string;
  readonly autoComplete?: string;
  readonly styles?: StylesConfig;
  readonly fonts?: readonly FontConfig[];
};

export type FormField<T extends FormType = FormType> = {
  [K in AllowedFieldNames<T>]: Readonly<
    BaseFieldConfig & {
      formId: string;
      type: K;
      paymentInstrumentType: PaymentInstrumentType<T>;
      labelText?: FormConfig<T>["showLabels"] extends true ? string : never;
      placeholder?: FormConfig<T>["showPlaceholders"] extends true ? Placeholder : never;
      errorMessage?: FormConfig<T>["hideErrorMessages"] extends false ? string : never;
      defaultValue?: K extends DefaultableField<T> ? string : never;
      required?: K extends AlwaysRequired<T> ? true : boolean;
    }
  >;
}[AllowedFieldNames<T>];
