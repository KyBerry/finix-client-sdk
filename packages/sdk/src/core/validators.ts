import { CardBrand, FieldName, ValidationResult } from "./types";

/**
 * Validate a card number using the Luhn algorithm
 * @param value The card number to validate
 * @returns Validation result with isValid and optional error message
 */
export function validateCardNumber(value: string): ValidationResult {
  if (!value) {
    return { isValid: false, errorMessage: "Card number is required" };
  }

  // Remove spaces and other non-digit characters
  const cleanValue = value.replace(/\D/g, "");

  // Check if only digits
  if (!/^\d+$/.test(cleanValue)) {
    return { isValid: false, errorMessage: "Card number must contain only digits" };
  }

  // Check length
  if (cleanValue.length < 13 || cleanValue.length > 19) {
    return { isValid: false, errorMessage: "Card number must be between 13 and 19 digits" };
  }

  // Luhn algorithm implementation
  let sum = 0;
  let shouldDouble = false;

  // Process from right to left
  for (let i = cleanValue.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanValue.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  const isValid = sum % 10 === 0;

  return {
    isValid,
    errorMessage: isValid ? undefined : "Invalid card number",
  };
}

/**
 * Validate an expiration date in MM/YY or MM/YYYY format
 * @param value The expiration date to validate
 * @returns Validation result with isValid and optional error message
 */
export function validateExpirationDate(value: string): ValidationResult {
  if (!value) {
    return { isValid: false, errorMessage: "Expiration date is required" };
  }

  // Accept either MM/YY or MM/YYYY format
  const match = value.match(/^(\d{1,2})\/(\d{2}|\d{4})$/);
  if (!match || !match[1] || !match[2]) {
    return { isValid: false, errorMessage: "Expiration date must be in MM/YY or MM/YYYY format" };
  }

  const month = parseInt(match[1], 10);
  let year = parseInt(match[2], 10);

  // Convert 2-digit year to 4-digit
  if (match[2].length === 2) {
    year += 2000;
  }

  // Check month is valid
  if (month < 1 || month > 12) {
    return { isValid: false, errorMessage: "Invalid month" };
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 0-indexed
  const currentYear = now.getFullYear();

  // Check if expired
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { isValid: false, errorMessage: "Card has expired" };
  }

  return { isValid: true };
}

/**
 * Validate a security code (CVV)
 * @param value The security code to validate
 * @param cardBrand Optional card brand for brand-specific validation
 * @returns Validation result with isValid and optional error message
 */
export function validateSecurityCode(value: string, cardBrand?: CardBrand): ValidationResult {
  if (!value) {
    return { isValid: false, errorMessage: "Security code is required" };
  }

  // Remove spaces and other non-digit characters
  const cleanValue = value.replace(/\D/g, "");

  // Check if only digits
  if (!/^\d+$/.test(cleanValue)) {
    return { isValid: false, errorMessage: "Security code must contain only digits" };
  }

  // AMEX requires 4 digits, others require 3
  const requiredLength = cardBrand === "amex" ? 4 : 3;

  if (cleanValue.length !== requiredLength) {
    return {
      isValid: false,
      errorMessage: `Security code must be ${requiredLength} digits`,
    };
  }

  return { isValid: true };
}

/**
 * Validate a routing number
 * @param value The routing number to validate
 * @returns Validation result with isValid and optional error message
 */
export function validateRoutingNumber(value: string): ValidationResult {
  if (!value) {
    return { isValid: false, errorMessage: "Routing number is required" };
  }

  // Remove spaces and other non-digit characters
  const cleanValue = value.replace(/\D/g, "");

  // Check length (US routing numbers are 9 digits)
  if (cleanValue.length !== 9) {
    return { isValid: false, errorMessage: "Routing number must be 9 digits" };
  }

  // Check if only digits
  if (!/^\d+$/.test(cleanValue)) {
    return { isValid: false, errorMessage: "Routing number must contain only digits" };
  }

  // Implement the checksum algorithm for US routing numbers
  // Each digit is multiplied by a weight (3, 7, or 1) based on position
  // The sum must be divisible by 10
  const ROUTING_WEIGHTS: readonly number[] = [3, 7, 1, 3, 7, 1, 3, 7, 1];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    const digit = cleanValue[i];
    if (digit === undefined) continue;
    sum += parseInt(digit, 10) * ROUTING_WEIGHTS[i]!;
  }

  const isValid = sum % 10 === 0;

  return {
    isValid,
    errorMessage: isValid ? undefined : "Invalid routing number",
  };
}

/**
 * Validate an account number
 * @param value The account number to validate
 * @returns Validation result with isValid and optional error message
 */
export function validateAccountNumber(value: string): ValidationResult {
  if (!value) {
    return { isValid: false, errorMessage: "Account number is required" };
  }

  // Remove spaces and other non-digit characters
  const cleanValue = value.replace(/\D/g, "");

  // Check if only digits
  if (!/^\d+$/.test(cleanValue)) {
    return { isValid: false, errorMessage: "Account number must contain only digits" };
  }

  // Check length (common account numbers are 4-17 digits)
  if (cleanValue.length < 4 || cleanValue.length > 17) {
    return { isValid: false, errorMessage: "Account number must be between 4 and 17 digits" };
  }

  return { isValid: true };
}

/**
 * Validate a name field
 * @param value The name to validate
 * @returns Validation result with isValid and optional error message
 */
export function validateName(value: string): ValidationResult {
  if (!value || !value.trim()) {
    return { isValid: false, errorMessage: "Name is required" };
  }

  // Basic validation: at least 2 characters
  if (value.trim().length < 2) {
    return { isValid: false, errorMessage: "Name must be at least 2 characters" };
  }

  return { isValid: true };
}

/**
 * Validate a postal code
 * @param value The postal code to validate
 * @param countryCode Optional country code for country-specific validation
 * @returns Validation result with isValid and optional error message
 */
export function validatePostalCode(value: string, countryCode = "USA"): ValidationResult {
  if (!value || !value.trim()) {
    return { isValid: false, errorMessage: "Postal code is required" };
  }

  // Different validation patterns based on country
  if (countryCode === "USA") {
    // US ZIP code: 5 digits or ZIP+4 format
    const isValid = /^\d{5}(-\d{4})?$/.test(value);
    return {
      isValid,
      errorMessage: isValid ? undefined : "Postal code must be 5 digits or ZIP+4 format",
    };
  } else if (countryCode === "CAN") {
    // Canadian postal code: A1A 1A1 format
    const isValid = /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/.test(value);
    return {
      isValid,
      errorMessage: isValid ? undefined : "Postal code must be in format A1A 1A1",
    };
  }

  // Default validation for other countries - ensure value exists
  return {
    isValid: Boolean(value && value.trim().length > 0),
    errorMessage: value && value.trim().length > 0 ? undefined : "Postal code is required",
  };
}

/**
 * Collection of validators by field name
 */
export const fieldValidators: Record<string, (value: string, context?: unknown) => ValidationResult> = {
  number: validateCardNumber,
  expiration_date: validateExpirationDate,
  security_code: (value: string, context?: unknown) => validateSecurityCode(value, context as CardBrand),
  name: validateName,
  account_number: validateAccountNumber,
  routing_number: validateRoutingNumber,
  bank_code: (value: string) => validateRoutingNumber(value),
  "address.postal_code": (value: string, context?: unknown) => {
    // Convert unknown context to string countryCode if possible
    const countryCode = typeof context === "string" ? context : "USA";
    return validatePostalCode(value, countryCode);
  },
  "address.line1": (value: string) => ({
    isValid: Boolean(value && value.trim().length > 0),
    errorMessage: value && value.trim().length > 0 ? undefined : "Address is required",
  }),
  "address.city": (value: string) => ({
    isValid: Boolean(value && value.trim().length > 0),
    errorMessage: value && value.trim().length > 0 ? undefined : "City is required",
  }),
  "address.state": (value: string) => ({
    isValid: Boolean(value && value.trim().length > 0),
    errorMessage: value && value.trim().length > 0 ? undefined : "State is required",
  }),
};

/**
 * Validate a field using the appropriate validator
 * @param fieldName The name of the field to validate
 * @param value The field value to validate
 * @param context Optional context for validation (e.g., card brand)
 * @returns Validation result with isValid and optional error message
 */
export function validateField(fieldName: FieldName, value: string, context?: unknown): ValidationResult {
  const validator = fieldValidators[fieldName];

  if (!validator) {
    // No validator found, assume valid
    return { isValid: true };
  }

  return validator(value, context);
}

/**
 * Detect the card brand based on the card number
 * @param cardNumber The card number to analyze
 * @returns The detected card brand
 */
export function detectCardBrand(cardNumber: string): CardBrand {
  // Handle null or undefined
  if (!cardNumber) return "unknown";

  // Clean the number first
  const cleanNumber = cardNumber.replace(/\D/g, "");

  // Only proceed if we have at least 6 digits
  if (cleanNumber.length < 6) return "unknown";

  // Extract the BIN/IIN (first 6 digits)
  const bin = cleanNumber.substring(0, 6);

  // Visa: Starts with 4
  if (/^4/.test(bin)) return "visa";

  // Mastercard: Starts with 51-55 or 2221-2720
  if (/^5[1-5]/.test(bin) || (/^2/.test(bin) && parseInt(bin.substring(0, 4), 10) >= 2221 && parseInt(bin.substring(0, 4), 10) <= 2720)) {
    return "mastercard";
  }

  // Amex: Starts with 34 or 37
  if (/^3[47]/.test(bin)) return "amex";

  // Discover: Starts with 6011, 622126-622925, 644-649, or 65
  if (/^6011/.test(bin) || (/^622/.test(bin) && parseInt(bin, 10) >= 622126 && parseInt(bin, 10) <= 622925) || /^6(?:4[4-9]|5)/.test(bin)) {
    return "discover";
  }

  return "unknown";
}
