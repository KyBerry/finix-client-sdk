/**
 * Response structure from the Finix API after tokenization
 */
export interface FinixTokenResponse {
  data?: {
    id: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

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
export type FieldName = CardFieldName | BankFieldName | AddressFieldName;

/**
 * Current state of the form's field values
 */
export type FormState = Record<FieldName, FieldState>;

export type FieldState = {
  isDirty: boolean;
  isFocused: boolean;
  errorMessages: string[];
};

export interface PaymentForm {
  getFormState(): FormState;
  setFormState(fieldName: FieldName, state: FieldState): void;
  submit(): Promise<FinixTokenResponse>;
  render(containerId: string): void;
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

export interface EnvironmentConfig {
  environment: "sandbox" | "qa" | "live" | "prod";
  applicationId: string;
  merchantId: string;
}
