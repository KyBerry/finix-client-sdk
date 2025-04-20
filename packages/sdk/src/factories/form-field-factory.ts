import { CARD_FORM_FIELDS, BANK_FORM_FIELDS, ADDRESS_FORM_FIELDS } from "@/constants";
import type { FormType, FormConfig, FormField, FieldName, FormId, PaymentInstrumentType } from "@/interfaces/types";

export class FormFieldFactory {
  /**
   * Create form fields based on payment type and configuration
   */
  static createFields<T extends FormType>(formId: FormId, formConfig: FormConfig<T>): Array<FormField<T>> {
    const { paymentType, showAddress, hideFields = [], requiredFields = [] } = formConfig;

    // Get base fields based on payment type
    const baseFields = this.getBaseFields(paymentType);

    // Add address fields if enabled
    const allFields = showAddress ? [...baseFields, ...ADDRESS_FORM_FIELDS] : baseFields;
  }

  /**
   * Create individual field configuration
   */
  private static createFieldConfig<T extends FormType>(formId: FormId, fieldId: string, paymentType: T, formConfig: FormConfig<T>, isRequired: boolean): FormField<T> {
    const { showLabels, showPlaceholders, hideErrorMessages, labels = {}, placeholders = {}, errorMessages = {}, defaultValues = {}, styles } = formConfig;

    return {
      formId,
      type: fieldId as FieldName,
      paymentInstrumentType: this.getPaymentInstrumentType(paymentType),
      ...(showLabels && { labelText: labels[fieldId as keyof typeof labels] }),
      ...(showPlaceholders && { placeholder: placeholders[fieldId as keyof typeof placeholders] }),
      ...(!hideErrorMessages && { errorMessages: errorMessages[fieldId as keyof typeof errorMessages] }),
      required: isRequired,
      styles,
    };
  }

  /**
   * Get base field definitions based on payment type
   */
  private static getBaseFields(paymentType: FormType) {
    switch (paymentType) {
      case "card":
        return CARD_FORM_FIELDS;
      case "bank":
        return BANK_FORM_FIELDS;
      case "token":
        return [...CARD_FORM_FIELDS, ...BANK_FORM_FIELDS];
      default:
        throw new Error(`Unsupported payment type: ${paymentType}`);
    }
  }

  /**
   * Map payment type to instrument type
   */
  private static getPaymentInstrumentType<T extends FormType>(paymentType: T): PaymentInstrumentType<T> {
    switch (paymentType) {
      case "card":
        return "PAYMENT_CARD" as PaymentInstrumentType<T>;
      case "bank":
        return "BANK_ACCOUNT" as PaymentInstrumentType<T>;
      case "token":
        // For token, we'll need to determine this later based on the actual fields used
        return "PAYMENT_CARD" as PaymentInstrumentType<T>;
      default:
        throw new Error(`Unsupported payment type: ${paymentType}`);
    }
  }
}
