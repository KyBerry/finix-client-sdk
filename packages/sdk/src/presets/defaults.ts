import type { FinixTokenFormOptions } from "@/types";
import { deepMerge } from "@/utils";

// TODO: make sure deepMerge is working the way I intend
const BASE = {
  showLabels: true,
  showPlaceholders: true,
  hideErrorMessages: false,
  showAddress: false,
  styles: {
    default: {
      color: "#000",
      border: "1px solid #CCCDCF",
      borderRadius: "8px",
      padding: "8px 16px",
      fontSize: "16px",
    },
    error: {
      border: "1px solid rgba(255,0,0, 0.3)",
    },
  },
};

const CARD_FIELDS = {
  labels: {
    name: "Cardholder Name",
    number: "Card Number",
    expiration_date: "Expiration",
    security_code: "CVV",
  },
  placeholders: {
    name: "Full name on card",
    number: "•••• •••• •••• ••••",
    expiration_date: "MM / YY",
    security_code: "123",
  },
};

const BANK_FIELDS = {
  labels: {
    name: "Account Holder Name",
    account_number: "Account Number",
    bank_code: "Routing Number",
    account_type: "Account Type",
  },
  placeholders: {
    name: "Full name on account",
    account_number: "1234567890",
    bank_code: "123456789",
  },
};

const ADDRESS_FIELDS = {
  showAddress: true,
  labels: {
    address_line1: "Billing Address",
    address_line2: "Apt/Suite",
    address_city: "City",
    address_state: "State/Province",
    address_postal_code: "Postal Code",
    address_country: "Country",
  },
  placeholders: {
    address_line1: "Billing Address",
    address_line2: "Apt/Suite",
    address_city: "City",
    address_state: "",
    address_postal_code: "",
    address_country: "",
  },
};

/**
 * Default configuration presets for different payment form scenarios
 */
export const DEFAULT_PRESETS = {
  base: BASE as FinixTokenFormOptions,
  /** Configuration optimized for collecting just card details */
  cardOnly: deepMerge<FinixTokenFormOptions>(BASE, CARD_FIELDS),
  /** Configuration optimized for collecting card details with address */
  cardWithAddress: deepMerge<FinixTokenFormOptions>(BASE, CARD_FIELDS, ADDRESS_FIELDS),
  /** Configuration optimized for collecting just bank account details */
  bankingOnly: deepMerge<FinixTokenFormOptions>(BASE, BANK_FIELDS),
  /** Configuration optimized for collecting bank account details with address */
  bankingWithAddress: deepMerge<FinixTokenFormOptions>(BASE, BANK_FIELDS, ADDRESS_FIELDS),
};

export type DefaultPresets = keyof typeof DEFAULT_PRESETS;
