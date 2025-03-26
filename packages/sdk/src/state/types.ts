import { ActionType } from "./actions/types";

export enum CARD_FIELD_TYPE {
  NUMBER = "number",
  EXPIRATION_DATE = "expiration_date",
  SECURITY_CODE = "security_code",
  NAME = "name",
}

export enum BANK_FIELD_TYPE {
  NAME = "name",
  ACCOUNT_TYPE = "account_type",
  ACCOUNT_NUMBER = "account_number",
  BANK_CODE = "bank_code",
}

export enum ADDRESS_Field_Type {
  ADDRESS_LINE1 = "address_line1",
  ADDRESS_LINE2 = "address_line2",
  ADDRESS_CITY = "address_city",
  ADDRESS_STATE = "address_state",
  ADDRESS_REGION = "address_region",
  ADDRESS_COUNTRY = "address_country",
  ADDRESS_POSTAL_CODE = "address_postal_code",
}

export enum CARD_BRAND_TYPE {
  VISA = "visa",
  MASTERCARD = "mastercard",
  AMEX = "amex",
  DISCOVER = "discover",
  DINERSCLUB = "dinersclub",
  JCB = "jcb",
  UNIONPAY = "unionpay",
  UNKNOWN = "unknown",
}

type CardPaymentField = CARD_FIELD_TYPE;

type BankPaymentField = BANK_FIELD_TYPE;

type AddressField = ADDRESS_Field_Type;

type CardBrand = CARD_BRAND_TYPE;

type FieldType = CardPaymentField | BankPaymentField | AddressField;

export type FieldState = {
  // Core field data
  value: string;

  // UI state
  isFocused: boolean;
  isDirty: boolean; // Has been modified from initial state
  isTouched: boolean; // Has been interacted with at least once

  // Validation state
  validation: {
    isValid: boolean;
    errorMessage?: string;
    rules: string[]; // Names of validation rules applied
  };

  // Field metadata
  isRequired: boolean;
  isHidden: boolean;
  fieldType: FieldType; // What kind of field this is

  // Field-specific properties
  maxLength?: number; // Optional for fields with length restrictions
  mask?: string; // Optional display formatting
  placeholder?: string; // Visual placeholder
};

export interface BinInformation {
  bin: string; // First couple of digits of card number
  cardBrand?: CardBrand; // Visa, MasterCard, etc.
}

export type FormState = {
  fields: Record<FieldType, FieldState>;
  binInformation?: BinInformation;
  isSubmitting: boolean;
};

export type FieldAction = {
  type: ActionType;
  payload: {
    fieldName: string;
    value?: string;
  };
};
