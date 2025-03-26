import type { FinixCoreConfig } from "@/types";

/**
 * Finix Environment
 */
export enum FINIX_ENVIRONMENT {
  QA = "qa",
  SANDBOX = "sandbox",
  LIVE = "live",
  PROD = "prod",
}

/**
 * Sift Beacon Key for each Finix environment
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
  ADDRESS_LINE1 = "address.line1",
  ADDRESS_LINE2 = "address.line2",
  ADDRESS_CITY = "address.city",
  ADDRESS_STATE = "address.state",
  ADDRESS_POSTAL_CODE = "address.postal_code",
  ADDRESS_COUNTRY = "address.country",
}

/**
 * Account types for bank accounts
 */
export enum ACCOUNT_TYPE {
  CHECKING = "checking",
  SAVINGS = "savings",
}

/**
 * Message types for iframe communication
 */
export enum MESSAGE_TYPE {
  FIELD_UPDATED = "field-updated",
  FORM_SUBMIT = "form-submit",
  BIN_INFORMATION = "bin-information-received",
  RESPONSE_RECEIVED = "response-received",
  RESPONSE_ERROR = "response-error",
  VALIDATION_ERROR = "validation-error",
  FOCUS = "focus",
  BLUR = "blur",
  READY = "ready",
}

/**
 * Error codes used throughout the SDK
 */
export enum ERROR_CODE {
  // Initialization errors
  INITIALIZATION_FAILED = "INITIALIZATION_FAILED",
  INVALID_ENVIRONMENT = "INVALID_ENVIRONMENT",

  // Configuration errors
  INVALID_CONFIG = "INVALID_CONFIG",
  MISSING_APPLICATION_ID = "MISSING_APPLICATION_ID",
  MISSING_MERCHANT_ID = "MISSING_MERCHANT_ID",

  // Form errors
  FORM_NOT_READY = "FORM_NOT_READY",
  INVALID_CONTAINER = "INVALID_CONTAINER",
  FIELD_RENDERING_ERROR = "FIELD_RENDERING_ERROR",

  // Validation errors
  INVALID_CARD_NUMBER = "INVALID_CARD_NUMBER",
  INVALID_EXPIRY_DATE = "INVALID_EXPIRY_DATE",
  INVALID_SECURITY_CODE = "INVALID_SECURITY_CODE",
  INVALID_ACCOUNT_NUMBER = "INVALID_ACCOUNT_NUMBER",
  INVALID_ROUTING_NUMBER = "INVALID_ROUTING_NUMBER",

  // API errors
  NETWORK_ERROR = "NETWORK_ERROR",
  API_ERROR = "API_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",

  // Security errors
  UNAUTHORIZED_ORIGIN = "UNAUTHORIZED_ORIGIN",
  CSP_ERROR = "CSP_ERROR",
  XSS_ATTEMPT = "XSS_ATTEMPT",
}

/**
 * Default configuration for the Finix SDK
 */
export const DEFAULT_CONFIG: FinixCoreConfig = {
  environment: FINIX_ENVIRONMENT.SANDBOX,
  applicationId: "",
  merchantId: "",
  apiTimeout: 5000,
  security: {
    allowedOrigins: [],
    enableHSTS: true,
    fraud: {
      enableSift: true,
      beaconKey: SIFT_BEACON_KEY.QA_SANDBOX,
    },
  },
};

/**
 * Default Beacon Keys for each Finix environment
 */
export const DEFAULT_BEACON_KEYS: Record<FINIX_ENVIRONMENT, string> = {
  [FINIX_ENVIRONMENT.QA]: SIFT_BEACON_KEY.QA_SANDBOX,
  [FINIX_ENVIRONMENT.SANDBOX]: SIFT_BEACON_KEY.QA_SANDBOX,
  [FINIX_ENVIRONMENT.LIVE]: SIFT_BEACON_KEY.LIVE_PROD,
  [FINIX_ENVIRONMENT.PROD]: SIFT_BEACON_KEY.LIVE_PROD,
};

/**
 * Default API URLs for each Finix environment
 */
export const DEFAULT_API_URLS: Record<FINIX_ENVIRONMENT, string> = {
  [FINIX_ENVIRONMENT.QA]: "https://finix.qa-payments-api.com",
  [FINIX_ENVIRONMENT.SANDBOX]: "https://finix.sandbox-payments-api.com",
  [FINIX_ENVIRONMENT.LIVE]: "https://finix.live-payments-api.com",
  [FINIX_ENVIRONMENT.PROD]: "https://finix.live-payments-api.com",
};

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
  [ADDRESS_FIELD_TYPE.ADDRESS_LINE1]: "Please enter a valid address",
  [ADDRESS_FIELD_TYPE.ADDRESS_CITY]: "Please enter a valid city",
  [ADDRESS_FIELD_TYPE.ADDRESS_STATE]: "Please enter a valid state",
  [ADDRESS_FIELD_TYPE.ADDRESS_POSTAL_CODE]: "Please enter a valid postal code",
  [ADDRESS_FIELD_TYPE.ADDRESS_COUNTRY]: "Please select a country",
};
