export const FINIX_ENVIRONMENT = {
  QA: "qa",
  SANDBOX: "sandbox",
  LIVE: "live",
  PROD: "prod",
} as const;

export const API_URLS = {
  [FINIX_ENVIRONMENT.QA]: "https://finix.qa-payments-api.com",
  [FINIX_ENVIRONMENT.SANDBOX]: "https://finix.sandbox-payments-api.com",
  [FINIX_ENVIRONMENT.LIVE]: "https://finix.live-payments-api.com",
  [FINIX_ENVIRONMENT.PROD]: "https://finix.live-payments-api.com",
} as const;

export const BEACON_KEYS = {
  [FINIX_ENVIRONMENT.QA]: "523dfab8f5",
  [FINIX_ENVIRONMENT.SANDBOX]: "523dfab8f5",
  [FINIX_ENVIRONMENT.LIVE]: "4ceeab9947",
  [FINIX_ENVIRONMENT.PROD]: "4ceeab9947",
} as const;

export const IFRAME_URL = "https://js.finix.com/v/1/payment-fields/index.html?" as const;

/**
 * Default card form fields configuration
 */
export const CARD_FORM_FIELDS = [
  {
    id: "name",
    label: "Name",
    placeholder: { text: "Cardholder Name", hideOnFocus: true },
    autoComplete: "cc-name",
  },
  {
    id: "number",
    label: "Card Number",
    placeholder: { text: "4111 1111 1111 1111", hideOnFocus: true },
    autoComplete: "cc-number",
  },
  {
    id: "expiration_date",
    label: "Expiration",
    placeholder: { text: "MM/YYYY", hideOnFocus: true },
    autoComplete: "cc-exp",
  },
  {
    id: "security_code",
    label: "CVV",
    placeholder: { text: "CVV", hideOnFocus: true },
    autoComplete: "cc-csc",
  },
] as const;

/**
 * Default bank form fields configuration
 */
export const BANK_FORM_FIELDS = [
  {
    id: "name",
    label: "Name",
    placeholder: { text: "Cardholder Name", hideOnFocus: true },
    autoComplete: "name",
    validation: "required",
  },
  {
    id: "account_number",
    label: "Account number",
    placeholder: { text: "Account number", hideOnFocus: true },
    validation: "required",
  },
  {
    id: "bank_code",
    label: "Routing number",
    placeholder: { text: "Routing number", hideOnFocus: true },
    validation: "required",
  },
  {
    id: "account_type",
    label: "Account type",
    placeholder: { text: "Account type", hideOnFocus: true },
    validation: "required",
  },
] as const;

/**
 * Default address form fields configuration
 */
export const ADDRESS_FORM_FIELDS = [
  {
    id: "address_line1",
    label: "Address Line 1",
    placeholder: { text: "Address Line 1", hideOnFocus: true },
    autoComplete: "address-line1",
  },
  {
    id: "address_line2",
    label: "Address Line 2",
    placeholder: { text: "Address Line 2", hideOnFocus: true },
    autoComplete: "address-line2",
  },
  {
    id: "address_city",
    label: "City",
    placeholder: { text: "City", hideOnFocus: true },
    autoComplete: "address-level2",
  },
  {
    id: "address_state",
    label: "State",
    placeholder: { text: "State", hideOnFocus: true },
    autoComplete: "address-level1",
  },
  {
    id: "address_postal_code",
    label: "Postal code",
    placeholder: { text: "Postal code", hideOnFocus: true },
    autoComplete: "postal-code",
  },
  {
    id: "address_country",
    label: "Country",
    placeholder: { text: "Country", hideOnFocus: true },
    autoComplete: "country",
    defaultOption: "USA",
  },
] as const;
