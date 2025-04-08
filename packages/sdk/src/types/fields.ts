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
export type FinixFormFieldName = CardFieldName | BankFieldName | AddressFieldName;

/**
 * Fields that can be hidden from the form
 */
export type HideableFieldName = Extract<FinixFormFieldName, "name" | "security_code" | AddressFieldName>;

/**
 * Fields that can be marked as required
 */
export type RequirableFieldName = Extract<FinixFormFieldName, "name" | AddressFieldName>;

/**
 * Fields that can have default values pre-filled
 */
export type DefaultValueFieldName = Extract<FinixFormFieldName, "name" | "security_code" | "bank_code" | "account_type" | AddressFieldName>;
