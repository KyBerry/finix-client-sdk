import type { FormField } from "@/interfaces/types";

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
    placeholder: "Cardholder Name",
    autoComplete: "cc-name",
    required: false,
  },
  {
    id: "number",
    label: "Card Number",
    placeholder: "4111 1111 1111 1111",
    autoComplete: "cc-number",
    required: true,
  },
  {
    id: "expiration_date",
    label: "Expiration",
    placeholder: "MM/YYYY",
    autoComplete: "cc-exp",
    required: true,
  },
  {
    id: "security_code",
    label: "CVV",
    placeholder: "CVV",
    validation: "cardCVC",
    autoComplete: "cc-csc",
    required: true,
  },
] as const;

/**
 * Default bank form fields configuration
 */
export const BANK_FORM_FIELDS = [
  {
    id: "name",
    label: "Name",
    placeholder: "Cardholder Name",
    autoComplete: "name",
    required: false,
  },
  {
    id: "account_number",
    label: "Account number",
    placeholder: "Account number",
    autoComplete: "off",
    required: true,
  },
  {
    id: "bank_code",
    label: "Routing number",
    placeholder: "Routing number",
  },
  {
    id: "account_type",
    label: "Account type",
    placeholder: "Account type",
  },
] as const;

/**
 * Default address form fields configuration
 */
export const ADDRESS_FORM_FIELDS = [
  {
    id: "address_line1",
    label: "Address Line 1",
    placeholder: "Address Line 1",
    autoComplete: "address-line1",
    required: false,
  },
  {
    id: "address_line2",
    label: "Address Line 2",
    placeholder: "Address Line 2",
    autoComplete: "address-line2",
    required: false,
  },
  {
    id: "address_city",
    label: "City",
    placeholder: "City",
    autoComplete: "address-level2",
    required: false,
  },
  {
    id: "address_state",
    label: "State",
    placeholder: "State",
    autoComplete: "address-level1",
    required: false,
  },
  {
    id: "address_postal_code",
    label: "Postal code",
    placeholder: "Postal code",
    autoComplete: "postal-code",
    required: false,
  },
  {
    id: "address_country",
    label: "Country",
    placeholder: "Country",
    autoComplete: "country",
    required: false,
  },
] as const;
