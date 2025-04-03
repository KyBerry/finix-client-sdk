/**
 * Core type definitions for the Finix SDK
 */

/**
 * Supported Finix environments
 */
export namespace Environment {
  export enum Type {
    QA = "qa",
    SANDBOX = "sandbox",
    LIVE = "live",
    PROD = "prod",
  }

  export const ApiUrls: Record<Type, string> = {
    [Type.QA]: "https://finix.qa-payments-api.com",
    [Type.SANDBOX]: "https://finix.sandbox-payments-api.com",
    [Type.LIVE]: "https://finix.live-payments-api.com",
    [Type.PROD]: "https://finix.live-payments-api.com",
  };

  export const BeaconKeys: Record<Type, string> = {
    [Type.QA]: "523dfab8f5",
    [Type.SANDBOX]: "523dfab8f5",
    [Type.LIVE]: "4ceeab9947",
    [Type.PROD]: "4ceeab9947",
  };

  export const IframeUrls: Record<Type, string> = {
    [Type.QA]: "https://js.finix.com/qa/payment-fields/index.html",
    [Type.SANDBOX]: "https://js.finix.com/sandbox/payment-fields/index.html",
    [Type.LIVE]: "https://js.finix.com/live/payment-fields/index.html",
    [Type.PROD]: "https://js.finix.com/live/payment-fields/index.html",
  };
}

// Legacy support for existing code
export type FINIX_ENVIRONMENT = Environment.Type;

/**
 * Status of the Finix SDK initialization
 */
export enum InitializationStatus {
  NOT_STARTED = "not_started",
  INITIALIZING = "initializing",
  READY = "ready",
  FAILED = "failed",
}

/**
 * Card form field types
 */
export enum CARD_FIELD_TYPE {
  NUMBER = "number",
  EXPIRATION_DATE = "expiration_date",
  SECURITY_CODE = "security_code",
  NAME = "name",
}

/**
 * Address form field types
 */
export enum ADDRESS_FIELD_TYPE {
  LINE1 = "address.line1",
  LINE2 = "address.line2",
  CITY = "address.city",
  STATE = "address.state",
  POSTAL_CODE = "address.postal_code",
  COUNTRY = "address.country",
  REGION = "address.region",
}

/**
 * Account types for bank accounts
 */
export enum ACCOUNT_TYPE {
  CHECKING = "checking",
  SAVINGS = "savings",
}

/**
 * Bank form field types
 */
export enum BANK_FIELD_TYPE {
  NAME = "name",
  ACCOUNT_NUMBER = "account_number",
  ROUTING_NUMBER = "routing_number",
  TRANSIT_NUMBER = "transit_number",
  INSTITUTION_NUMBER = "institution_number",
  BANK_CODE = "bank_code",
  ACCOUNT_TYPE = "account_type",
}

/**
 * Default error messages by field
 */
export const DEFAULT_ERROR_MESSAGES: Record<string, string> = {
  // Card fields
  [CARD_FIELD_TYPE.NUMBER]: "Please enter a valid card number",
  [CARD_FIELD_TYPE.EXPIRATION_DATE]: "Please enter a valid expiration date",
  [CARD_FIELD_TYPE.SECURITY_CODE]: "Please enter a valid security code",
  [CARD_FIELD_TYPE.NAME]: "Please enter the cardholder name",

  // Bank fields
  [BANK_FIELD_TYPE.ACCOUNT_NUMBER]: "Please enter a valid account number",
  [BANK_FIELD_TYPE.ROUTING_NUMBER]: "Please enter a valid routing number",
  [BANK_FIELD_TYPE.BANK_CODE]: "Please enter a valid bank code",
  [BANK_FIELD_TYPE.TRANSIT_NUMBER]: "Please enter a valid transit number",
  [BANK_FIELD_TYPE.INSTITUTION_NUMBER]: "Please enter a valid institution number",

  // Address fields
  [ADDRESS_FIELD_TYPE.LINE1]: "Please enter a valid address",
  [ADDRESS_FIELD_TYPE.CITY]: "Please enter a valid city",
  [ADDRESS_FIELD_TYPE.STATE]: "Please enter a valid state",
  [ADDRESS_FIELD_TYPE.POSTAL_CODE]: "Please enter a valid postal code",
  [ADDRESS_FIELD_TYPE.COUNTRY]: "Please select a country",
};

/**
 * Branded types for stronger type checking
 */
export type FormId = string & { readonly _brand: unique symbol };
export type ApplicationId = string & { readonly _brand: unique symbol };
export type TokenId = string & { readonly _brand: unique symbol };
export type MerchantId = string & { readonly _brand: unique symbol };

/**
 * Types of payment instruments supported
 */
export const PAYMENT_INSTRUMENTS = {
  card: "PAYMENT_CARD",
  bankAccount: "BANK_ACCOUNT",
} as const;

/**
 * Supported card brands
 */
export const CARD_BRANDS = {
  VISA: "visa",
  MASTERCARD: "mastercard",
  AMEX: "amex",
  DISCOVER: "discover",
  UNKNOWN: "unknown",
} as const;

/**
 * Card brand type
 */
export type CardBrand = (typeof CARD_BRANDS)[keyof typeof CARD_BRANDS];

/**
 * Mapping from our field names to the API field names
 */
export const FORM_NAME_MAPPER = {
  name: "name",
  number: "number",
  expirationDate: "expiration_date",
  securityCode: "security_code",
  accountNumber: "account_number",
  routingNumber: "routing_number",
  bankCode: "bank_code",
  accountType: "account_type",
  addressLine1: "address.line1",
  addressLine2: "address.line2",
  addressCity: "address.city",
  addressState: "address.state",
  addressRegion: "address.region",
  addressCountry: "address.country",
  addressPostalCode: "address.postal_code",
} as const;

/**
 * Field names in our form
 */
export type FieldName = keyof typeof FORM_NAME_MAPPER;

/**
 * Fields that can be hidden in the form (excluding required ones)
 */
export type HideableFieldName = Exclude<FieldName, "number" | "expirationDate" | "accountNumber">;

/**
 * Supported payment types
 */
export type PaymentType = keyof typeof PAYMENT_INSTRUMENTS;

/**
 * Font format supported for custom fonts
 */
export type FontFormat = "woff" | "woff2" | "truetype" | "opentype" | "embedded-opentype" | "svg";

/**
 * Font definition for custom fonts
 */
export interface Font {
  readonly fontFamily: string;
  readonly url: string;
  readonly format: FontFormat;
}

/**
 * Array of font definitions
 */
export type Fonts = readonly Font[];

/**
 * Represents the state of an individual form field.
 */
export interface FieldState {
  /** The current value of the field */
  readonly value: string;
  /** Whether the field currently has focus */
  readonly isFocused: boolean;
  /** Whether the field has been modified by the user */
  readonly isDirty: boolean;
  /** Whether the field's current value passes validation */
  readonly isValid: boolean;
  /** Error messages if validation fails */
  readonly errorMessages: string[];
  /** Selected option for dropdown fields */
  readonly selected?: string;
  /** Selected country for country fields */
  readonly country?: string;
}

/**
 * BIN information returned from card network lookup.
 */
export interface BinInformation {
  /** The card's brand (Visa, Mastercard, etc.) */
  readonly cardBrand: CardBrand;
  /** First 6-8 digits of the card (the BIN/IIN) */
  readonly bin: string;
}

/**
 * The result of validating a field's value.
 */
export interface ValidationResult {
  /** Whether the validation passed */
  readonly isValid: boolean;
  /** Error message if validation failed */
  readonly errorMessage?: string;
}

/**
 * Type for field validation functions
 */
export type FieldValidator = (value: string) => ValidationResult;

/**
 * Type-safe mapping for field validations
 */
export type FieldValidations = {
  readonly [K in FieldName]?: readonly FieldValidator[];
};

/**
 * Style options for customizing the appearance of form fields.
 */
export interface StyleOptions {
  /** Base styles for the field in its default state */
  readonly default?: Readonly<{
    color?: string;
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
    padding?: string;
    border?: string;
    borderRadius?: string;
    boxShadow?: string;
  }>;
  /** Styles applied when the field has focus */
  readonly focus?: Readonly<{
    color?: string;
    border?: string;
    boxShadow?: string;
  }>;
  /** Styles applied when the field has a validation error */
  readonly error?: Readonly<{
    color?: string;
    border?: string;
    boxShadow?: string;
  }>;
  /** Styles applied when the field passes validation */
  readonly success?: Readonly<{
    color?: string;
    border?: string;
    boxShadow?: string;
  }>;
}

/**
 * Configuration options for a specific field.
 */
export interface FieldOptions {
  /** Label text for the field */
  readonly label?: string;
  /** Placeholder text for the field */
  readonly placeholder?: {
    readonly text: string;
    readonly hideOnFocus?: boolean;
  };
  /** Validation functions to apply to this field */
  readonly validations?: string | readonly FieldValidator[];
  /** Whether to enable browser autocomplete */
  readonly autoComplete?: boolean | string;
  /** Error message to display if validation fails */
  readonly errorMessage?: string;
  /** Custom fonts to use for this field */
  readonly fonts?: Fonts;
  /** Default value for the field */
  readonly defaultValue?: string;
  /** Default option for dropdowns */
  readonly defaultOption?: string;
  /** Options for dropdown fields */
  readonly options?: string[] | "country" | "state" | "account_type";
  /** Custom styles for the field */
  readonly styles?: StyleOptions;
}

/**
 * Error types for better error handling
 */
export type ApiError = Readonly<{
  code: string;
  message: string;
  details?: unknown;
}>;

export type ValidationError = Readonly<{
  field: FieldName;
  message: string;
}>;

export type FormError = ApiError | ValidationError | string;

/**
 * Callbacks for form events with specific type definitions
 */
export type FormReadyCallback = () => void;
export type FormUpdateCallback = (state: FormState, binInfo: BinInformation | undefined, hasErrors: boolean) => void;
export type FormSubmitCallback = () => void;

/**
 * Configuration options for creating a form.
 */
export interface FormOptions {
  /** Environment this form is operating in */
  readonly environment: Environment.Type;
  /** Application ID for this form */
  readonly applicationId: ApplicationId | string;
  /** Whether to show field labels */
  readonly showLabels?: boolean;
  /** Whether to show field placeholders */
  readonly showPlaceholders?: boolean;
  /** Whether to show address fields */
  readonly showAddress?: boolean;
  /** Fields to hide from the form */
  readonly hideFields?: HideableFieldName[];
  /** Fields that are required (will be validated) */
  readonly requiredFields?: FieldName[];
  /** Custom styles for the form fields */
  readonly styles?: StyleOptions;
  /** Custom web fonts to load */
  readonly fonts?: Fonts;
  /** Callback when the form is fully loaded and ready */
  readonly onReady?: FormReadyCallback;
  /** Callback when the form state changes */
  readonly onUpdate?: FormUpdateCallback;
  /** Callback when the form is submitted */
  readonly onSubmit?: FormSubmitCallback;
  /** Custom text for the submit button */
  readonly submitLabel?: string;
  /** Custom error messages by field */
  readonly errorMessages?: Record<string, string>;
  /** Default country for address */
  readonly defaultCountry?: string;
  /** Default values for fields */
  readonly defaultValues?: Record<string, string>;
  /** Whether to hide error messages */
  readonly hideErrorMessages?: boolean;
}

/**
 * The complete state of a payment form.
 */
export interface FormState<T extends PaymentType = PaymentType> {
  /** Unique identifier for this form instance */
  readonly formId: FormId;
  /** The type of payment this form handles */
  readonly paymentType: T;
  /** Collection of all fields in the form */
  readonly fields: Readonly<Record<string, FieldState>>;
  /** BIN information if this is a card form */
  readonly binInformation: BinInformation;
  /** Whether this form is currently submitting */
  readonly isSubmitting: boolean;
  /** Errors from the last submission attempt */
  readonly submitErrors?: readonly FormError[];
  /** Form options used during initialization */
  readonly options: FormOptions;
}

/**
 * Message types for iframe communication
 */
export enum MessageType {
  FIELD_UPDATED = "field-updated",
  FORM_SUBMIT = "form-submit",
  BIN_INFORMATION = "bin-information-received",
  RESPONSE_RECEIVED = "response-received",
  RESPONSE_ERROR = "response-error",
  SUBMIT = "submit",
}

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
 * Field update message data
 */
export interface FieldUpdateMessageData {
  readonly name: string;
  readonly state: FieldState;
}

/**
 * Submit message data
 */
export interface SubmitMessageData {
  readonly environment: Environment.Type;
  readonly applicationId: string;
  readonly data: Record<string, unknown>;
}
