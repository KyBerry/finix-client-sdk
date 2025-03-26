/**
 * Supported Finix environments
 */
export enum FINIX_ENVIRONMENT {
  QA = "qa",
  SANDBOX = "sandbox",
  LIVE = "live",
  PROD = "prod",
}

/**
 * Sift Science beacon keys for fraud detection
 */
export enum SIFT_BEACON_KEY {
  QA_SANDBOX = "523dfab8f5",
  LIVE_PROD = "4ceeab9947",
}

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
 * Default Sift Science beacon keys by environment
 */
export const DEFAULT_BEACON_KEYS: Record<FINIX_ENVIRONMENT, string> = {
  [FINIX_ENVIRONMENT.QA]: SIFT_BEACON_KEY.QA_SANDBOX,
  [FINIX_ENVIRONMENT.SANDBOX]: SIFT_BEACON_KEY.QA_SANDBOX,
  [FINIX_ENVIRONMENT.LIVE]: SIFT_BEACON_KEY.LIVE_PROD,
  [FINIX_ENVIRONMENT.PROD]: SIFT_BEACON_KEY.LIVE_PROD,
};

/**
 * Default API URLs by environment
 */
export const DEFAULT_API_URLS: Record<FINIX_ENVIRONMENT, string> = {
  [FINIX_ENVIRONMENT.QA]: "https://finix.qa-payments-api.com",
  [FINIX_ENVIRONMENT.SANDBOX]: "https://finix.sandbox-payments-api.com",
  [FINIX_ENVIRONMENT.LIVE]: "https://finix.live-payments-api.com",
  [FINIX_ENVIRONMENT.PROD]: "https://finix.live-payments-api.com",
};

/**
 * Mapping from our field names to the API field names
 */
export const FORM_NAME_MAPPER = {
  name: "name",
  number: "number",
  expirationDate: "expiration_date",
  securityCode: "security_code",
  accountNumber: "account_number",
  bankCode: "bank_code",
  accountType: "account_type",
  addressLine1: "address_line1",
  addressLine2: "address_line2",
  addressCity: "address_city",
  addressState: "address_state",
  addressRegion: "addressRegion",
  addressCountry: "address_country",
  addressPostalCode: "address_postal_code",
} as const;

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
} as const;

/**
 * Card brand type
 */
export type CardBrand = (typeof CARD_BRANDS)[keyof typeof CARD_BRANDS];

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
export type Font = {
  fontFamily: string;
  url: string;
  format: FontFormat;
};

/**
 * Array of font definitions
 */
export type Fonts = Font[];

/**
 * Represents the state of an individual form field.
 * Contains all the metadata and values needed to track a field's lifecycle.
 */
export interface FieldState {
  /** The current value of the field */
  value: string;
  /** Whether the field currently has focus */
  isFocused: boolean;
  /** Whether the field has been modified by the user */
  isDirty: boolean;
  /** Whether the field's current value passes validation */
  isValid: boolean;
  /** Error messages if validation fails */
  errorMessages: string[];
  /** Selected option for dropdown fields */
  selected?: string;
  /** Selected country for country fields */
  country?: string;
  /** Single error message (for backward compatibility) */
  errorMessage?: string;
}

/**
 * BIN information returned from card network lookup.
 * Contains metadata about the card used for various business logic.
 */
export interface BinInformation {
  /** The card's brand (Visa, Mastercard, etc.) */
  cardBrand?: CardBrand;
  /** First 6-8 digits of the card (the BIN/IIN) */
  bin?: string;
  /** Card level (Gold, Platinum, etc.) */
  level?: string;
  /** Issuing bank */
  issuer?: string;
  /** Country of issuance */
  country?: string;
  /** Whether this is a debit card */
  isDebit?: boolean;
  /** Whether this is a commercial/business card */
  isCommercial?: boolean;
  /** How the card is funded */
  funding?: string;
  /** Product type of the card */
  product?: string;
  /** Whether this is an international card */
  isInternational?: boolean;
  /** Whether this card is eligible for fast funds (rapid settlement) */
  isFastFundsEligible?: boolean;
}

/**
 * The result of validating a field's value.
 * Used to track validation state and provide user feedback.
 */
export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  /** Error message if validation failed */
  errorMessage?: string;
}

/**
 * Style options for customizing the appearance of form fields.
 * These get passed to the iframes for consistent styling.
 */
export interface StyleOptions {
  /** Base styles for the field in its default state */
  base?: {
    color?: string;
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
    padding?: string;
  };
  /** Styles applied when the field has focus */
  focus?: {
    color?: string;
    border?: string;
  };
  /** Styles applied when the field has a validation error */
  error?: {
    color?: string;
    border?: string;
  };
  /** Styles applied when the field passes validation */
  success?: {
    color?: string;
    border?: string;
  };
}

/**
 * Configuration options for a specific field.
 */
export interface FieldOptions {
  /** Label text for the field */
  label?: string;
  /** Placeholder text for the field */
  placeholder?: string;
  /** Validation functions to apply to this field */
  validations?: Function[];
  /** Whether to enable browser autocomplete */
  autoComplete?: boolean;
  /** Error message to display if validation fails */
  errorMessage?: string;
  /** Custom fonts to use for this field */
  fonts?: string;
  /** Default value for the field */
  defaultValue?: string;
  /** Custom styles for the field */
  styles?: StyleOptions;
}

/**
 * Configuration options for creating a form.
 * This is the primary way to customize form behavior and appearance.
 */
export interface FormOptions {
  /** The environment to operate in */
  environment: FINIX_ENVIRONMENT | keyof typeof FINIX_ENVIRONMENT;
  /** Your Finix application ID */
  applicationId: string;
  /** Whether to show field labels */
  showLabels?: boolean;
  /** Whether to show field placeholders */
  showPlaceholders?: boolean;
  /** Whether to show address fields */
  showAddress?: boolean;
  /** Fields to hide from the form */
  hideFields?: HideableFieldName[];
  /** Custom styles for the form fields */
  styles?: StyleOptions;
  /** Custom web fonts to load */
  fonts?: Fonts;
  /** Callback when the form is fully loaded and ready */
  onReady?: () => void;
  /** Callback when the form state changes */
  onUpdate?: (state: any, binInfo: BinInformation | undefined, hasErrors: boolean) => void;
  /** Callback when the form is submitted */
  onSubmit?: () => void;
  /** Custom text for the submit button */
  submitLabel?: string;
}
