/**
 * Default card form fields configuration
 */
export const CARD_FORM_FIELDS = [
  {
    id: "name",
    label: "Name",
    placeholder: "Cardholder Name",
    autoComplete: "cc-name",
    grouping: "main",
    required: false,
  },
  {
    id: "number",
    label: "Card Number",
    placeholder: "4111 1111 1111 1111",
    autoComplete: "cc-number",
    grouping: "main",
    required: true,
  },
  {
    id: "expiration_date",
    label: "Expiration",
    placeholder: "MM/YYYY",
    autoComplete: "cc-exp",
    grouping: "row",
    required: true,
  },
  {
    id: "security_code",
    label: "CVV",
    placeholder: "CVV",
    validation: "cardCVC",
    autoComplete: "cc-csc",
    grouping: "row",
    required: true,
  },
];

/**
 * Default bank form fields configuration
 */
export const BANK_FORM_FIELDS = [
  {
    id: "name",
    label: "Name",
    placeholder: "Cardholder Name",
    autoComplete: "name",
    grouping: "main",
    required: false,
  },
  {
    id: "account_number",
    label: "Account number",
    placeholder: "Account number",
    autoComplete: "off",
    grouping: "main",
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
];

/**
 * Default address form fields configuration
 */
export const ADDRESS_FORM_FIELDS = [
  {
    id: "address_line1",
    label: "Address Line 1",
    placeholder: "Address Line 1",
    autoComplete: "address-line1",
    grouping: "main",
    required: false,
  },
  {
    id: "address_line2",
    label: "Address Line 2",
    placeholder: "Address Line 2",
    autoComplete: "address-line2",
    grouping: "main",
    required: false,
  },
  {
    id: "address_city",
    label: "City",
    placeholder: "City",
    autoComplete: "address-level2",
    grouping: "row",
    required: false,
  },
  {
    id: "address_state",
    label: "State",
    placeholder: "State",
    autoComplete: "address-level1",
    grouping: "row",
    required: false,
  },
  {
    id: "address_postal_code",
    label: "Postal code",
    placeholder: "Postal code",
    autoComplete: "postal-code",
    grouping: "row",
    required: false,
  },
  {
    id: "address_country",
    label: "Country",
    placeholder: "Country",
    autoComplete: "country",
    grouping: "row",
    required: false,
  },
];
