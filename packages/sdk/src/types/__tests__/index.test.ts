import { createForm, createTypedField } from "@/types";

// --- Test Case 1: Basic Form Creation ---
// This should type check properly for each form type
const testBasicForms = () => {
  // Valid: Token form creation
  const tokenForm = createForm({
    paymentType: "token",
  });

  // Valid: Bank form creation
  const bankForm = createForm({
    paymentType: "bank",
  });

  // Valid: Card form creation
  const cardForm = createForm({
    paymentType: "card",
  });
};

// --- Test Case 2: Form Type Restrictions ---
// This demonstrates the field restrictions based on form type
const testFormTypeRestrictions = () => {
  // Valid: Card form with card fields
  const cardForm = createForm({
    paymentType: "card",
    showLabels: true as const,
    labels: {
      name: "Name on Card",
      number: "Card Number",
      expiration_date: "Expires On",
      security_code: "Security Code",
    },
  });

  // Valid: Bank form with bank fields
  const bankForm = createForm({
    paymentType: "bank",
    showLabels: true,
    labels: {
      account_number: "Account Number",
      bank_code: "Routing Number",
      account_type: "Account Type",
    },
  });

  // Valid: Token form with both card and bank fields
  const tokenForm = createForm({
    paymentType: "token",
    showLabels: true,
    labels: {
      // Card fields
      name: "Name on Card",
      number: "Card Number",
      // Bank fields
      account_number: "Account Number",
      bank_code: "Routing Number",
    },
  });

  // Type Error: Card form with bank fields
  const invalidCardForm = createForm({
    paymentType: "card",
    showLabels: true,
    labels: {
      name: "Name on Card",
      // @ts-expect-error - account_number is not a valid field for card forms
      account_number: "Account Number", // Error: not valid for card form
    },
  });

  // Type Error: Bank form with card fields
  const invalidBankForm = createForm({
    paymentType: "bank",
    showLabels: true,
    labels: {
      account_number: "Account Number",
      // @ts-expect-error - number is not a valid field for bank forms
      number: "Card Number", // Error: not valid for bank form
    },
  });
};

// --- Test Case 3: Address Fields Conditional Logic ---
// Tests that address fields are only available when showAddress is true
const testAddressFieldsConditional = () => {
  // Valid: Form with showAddress true and address fields
  const formWithAddress = createForm({
    paymentType: "card",
    showAddress: true,
    showLabels: true,
    labels: {
      name: "Name on Card",
      number: "Card Number",
      address_line1: "Street Address",
      address_city: "City",
      address_state: "State",
      address_postal_code: "ZIP Code",
    },
  });

  // Type Error: Form without showAddress but with address fields
  const invalidAddressForm = createForm({
    paymentType: "card",
    showAddress: false, // or omitted
    showLabels: true,
    labels: {
      name: "Name on Card",
      // @ts-expect-error - address_line1 is not valid without showAddress true
      address_line1: "Street Address", // Error: showAddress not true
    },
  });

  // Valid: Token form with address fields when showAddress is true
  const tokenFormWithAddress = createForm({
    paymentType: "token",
    showAddress: true,
    showLabels: true,
    labels: {
      name: "Name on Card",
      account_number: "Account Number",
      address_line1: "Street Address",
    },
  });
};

// --- Test Case 4: Conditional UI Options ---
// Tests that labels, placeholders, and errorMessages are only available
// when their corresponding flags are set
const testConditionalUIOptions = () => {
  // Valid: Form with showLabels true and labels
  const formWithLabels = createForm({
    paymentType: "card",
    showLabels: true,
    labels: {
      name: "Name on Card",
      number: "Card Number",
    },
  });

  // Type Error: Form without showLabels but with labels
  const invalidLabelsForm = createForm({
    paymentType: "card",
    showLabels: false, // or omitted
    // @ts-expect-error - labels not allowed when showLabels is false
    labels: {
      name: "Name on Card",
    },
  });

  // Valid: Form with showPlaceholders true and placeholders
  const formWithPlaceholders = createForm({
    paymentType: "card",
    showPlaceholders: true as const,
    placeholders: {
      name: "John Doe",
      number: "1234 5678 9012 3456",
    },
  });

  // Type Error: Form without showPlaceholders but with placeholders
  const invalidPlaceholdersForm = createForm({
    paymentType: "card",
    showPlaceholders: false, // or omitted
    // @ts-expect-error - placeholders not allowed when showPlaceholders is false
    placeholders: {
      name: "John Doe",
    },
  });

  // Valid: Form with hideErrorMessages false and errorMessages
  const formWithErrorMessages = createForm({
    paymentType: "card",
    hideErrorMessages: false,
    errorMessages: {
      name: "Please enter the name as it appears on the card",
      number: "Please enter a valid card number",
    },
  });

  // Type Error: Form with hideErrorMessages true but with errorMessages
  const invalidErrorMessagesForm = createForm({
    paymentType: "card",
    hideErrorMessages: true,
    // @ts-expect-error - errorMessages not allowed when hideErrorMessages is true
    errorMessages: {
      name: "Please enter the name as it appears on the card",
    },
  });
};

// --- Test Case 5: Field Restrictions with Business Logic ---
// Tests the restrictions on defaultValues, requiredFields, and hideFields
const testBusinessLogicRestrictions = () => {
  // Valid: Form with valid defaultValues
  const formWithDefaultValues = createForm({
    paymentType: "card",
    defaultValues: {
      name: "John Doe",
      // Note: number, expiration_date, and security_code should not be allowed as defaults
    },
  });

  // Type Error: Form with invalid defaultValues
  const invalidDefaultValuesForm = createForm({
    paymentType: "card",
    defaultValues: {
      name: "John Doe",
      // @ts-expect-error - security_code cannot have a default value
      expiration_date: "10/29", // Error: expiration_date cannot have a default value
    },
  });

  // Valid: Form with valid requiredFields
  const formWithRequiredFields = createForm({
    paymentType: "card",
    requiredFields: [
      "name",
      // Note: number, expiration_date, and security_code are always required
    ],
  });

  // Type Error: Form with invalid requiredFields
  const invalidRequiredFieldsForm = createForm({
    paymentType: "card",
    requiredFields: [
      "name",
      // @ts-expect-error - security_code is always required and cannot be in requiredFields
      "security_code", // Error: security_code is always required
    ],
  });

  // Valid: Form with valid hideFields
  const formWithHideFields = createForm({
    paymentType: "card",
    hideFields: [
      "name",
      "security_code",
      // Note: number and expiration_date cannot be hidden
    ],
  });

  // Type Error: Form with invalid hideFields
  const invalidHideFieldsForm = createForm({
    paymentType: "card",
    hideFields: [
      "name",
      // @ts-expect-error - number cannot be hidden
      "number", // Error: card number cannot be hidden
    ],
  });
};

// --- Test Case 6: Complex Combinations ---
// Tests complex combinations of options
const testComplexCombinations = () => {
  // Valid: Complex form with multiple options
  const complexForm = createForm({
    paymentType: "token",
    showAddress: true,
    showLabels: true,
    showPlaceholders: true,
    hideErrorMessages: false,
    hideFields: ["security_code", "account_type", "address_region"],
    requiredFields: ["name", "address_line1", "address_postal_code"],
    defaultValues: {
      name: "John Doe",
      address_line1: "123 Main St",
      address_city: "Anytown",
      address_state: "CA",
      address_postal_code: "12345",
    },
    labels: {
      name: "Full Name",
      number: "Card Number",
      account_number: "Account Number",
      address_line1: "Street Address",
    },
    placeholders: {
      name: "John Doe",
      number: "1234 5678 9012 3456",
      address_line1: "123 Main St",
    },
    errorMessages: {
      name: "Please enter your full name",
      number: "Please enter a valid card number",
      address_postal_code: "Please enter a valid postal code",
    },
  });

  // This should have many configuration options properly typed
  const bankWithAddressForm = createForm({
    paymentType: "bank",
    showAddress: true,
    showLabels: true,
    labels: {
      account_number: "Account Number",
      bank_code: "Routing Number",
      account_type: "Account Type",
      address_line1: "Street Address",
      address_city: "City",
    },
  });
};

// --- Test Case 7: Form Field Access ---
// Tests that form fields have the correct types
const testFormFieldAccess = () => {
  // Card form field access
  const nameField = createTypedField<"card", true>({
    formId: "form1",
    type: "name",
    paymentInstrumentType: "PAYMENT_CARD",
    labelText: "Name on Card",
    placeholder: { text: "John Doe" },
    errorMessage: "Please enter your name as it appears on the card",
    defaultValue: "John Doe",
    required: true,
  });

  // Bank form field access
  const accountNumberField = createTypedField<"bank">({
    formId: "form2",
    type: "account_number",
    paymentInstrumentType: "BANK_ACCOUNT",
    labelText: "Account Number",
    placeholder: { text: "12345678" },
    errorMessage: "Please enter a valid account number",
    required: true, // Always required
  });

  // Address field with showAddress true
  const addressField = createTypedField<"card", true>({
    formId: "form3",
    type: "address_line1",
    paymentInstrumentType: "PAYMENT_CARD",
    labelText: "Street Address",
    placeholder: { text: "123 Main St" },
    errorMessage: "Please enter your street address",
    defaultValue: "123 Main St",
    required: false,
  });

  // Type Error: Using address field without showAddress true
  const invalidAddressField = createTypedField<"card">({
    formId: "form4",
    // @ts-expect-error - address_line1 is not valid without showAddress true
    type: "address_line1",
    paymentInstrumentType: "PAYMENT_CARD",
    labelText: "Street Address",
    required: false,
  });

  // Type Error: Using card field with bank form
  const invalidBankField = createTypedField<"bank">({
    formId: "form5",
    // @ts-expect-error - number is not valid for bank form
    type: "number",
    paymentInstrumentType: "BANK_ACCOUNT",
    labelText: "Card Number",
    required: true,
  });

  // Type Error: Default value for non-defaultable field
  const invalidDefaultField = createTypedField<"card">({
    formId: "form6",
    type: "expiration_date",
    paymentInstrumentType: "PAYMENT_CARD",
    labelText: "Expiration date",
    // @ts-expect-error - security_code cannot have a default value
    defaultValue: "10/29",
    required: true,
  });
};
