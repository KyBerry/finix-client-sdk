import { randomUUID } from "node:crypto";

const FORM_NAME_MAPPER = {
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

const PAYMENT_INSTRUMENTS = {
  card: "PAYMENT_CARD",
  bankAccount: "BANK_ACCOUNT",
} as const;

export const CARD_BRANDS = {
  VISA: "visa",
  MASTERCARD: "mastercard",
  AMEX: "amex",
  DISCOVER: "discover",
} as const;

export type CardBrand = (typeof CARD_BRANDS)[keyof typeof CARD_BRANDS];
export type FieldName = keyof typeof FORM_NAME_MAPPER;
export type HideableFieldName = Exclude<FieldName, "number" | "expirationDate" | "accountNumber">;
export type PaymentType = keyof typeof PAYMENT_INSTRUMENTS;

export interface FieldState {
  isFocused: boolean;
  isDirty: boolean;
  errorMessages: string[];
  selected?: string;
  country?: string;
}

export type BinInformation = {
  // These are the core properties always available
  cardBrand?: CardBrand;
  bin?: string;

  // These may be available depending on the card
  level?: string; // standard, gold, platinum, etc.
  issuer?: string; // issuing bank name
  country?: string; // country of issuance
  isDebit?: boolean; // true if debit, false if credit
  isCommercial?: boolean; // true for business/corporate cards
  funding?: string; // credit, debit, prepaid
  product?: string; // specific product type offered by issuer
  isInternational?: boolean; // whether the card is issued outside the US
  isFastFundsEligible?: boolean; // whether funds settle in 30 mins or less
};

type FormManagerOptions = {
  showLabels: boolean;
  showPlaceholders: boolean;
  onUpdate?: (state: {}, binInformation: {}, formHasErrors: boolean) => void;
  onSubmit?: () => void;
  submitLabel?: string;
};

export type FontFormat = "woff" | "woff2" | "truetype" | "opentype" | "embedded-opentype" | "svg";

export type Font = {
  fontFamily: string;
  url: string;
  format: FontFormat;
};

export type Fonts = Font[];

export type FieldOptions = {
  label?: string;
  placeholder?: string;
  validations?: Function[];
  autoComplete?: true;
  errorMessage?: string;
  fonts?: string;
  defaultValue?: string;
};

export class FormManager {
  private fields: HTMLIFrameElement[] = [];
  private readonly formId: string;
  private readonly paymentType: PaymentType;
  private readonly options: FormManagerOptions;

  constructor(paymentType: PaymentType, options: FormManagerOptions = { showPlaceholders: true, showLabels: true }) {
    this.paymentType = paymentType;
    this.formId = `form-${Date.now()}-${randomUUID()}`;
    this.options = options;
  }

  createField(fieldName: FieldName, fieldOptions: FieldOptions) {
    const cleanedFieldOptions = cleanObject(fieldOptions);
  }
}

function cleanObject<T extends Record<string, any>>(object: T): Partial<T> {
  return Object.entries(object).reduce((prev, [key, value]) => {
    if (value) {
      prev[key as keyof T] = value;
    }
    return prev;
  }, {} as Partial<T>);
}
