import { BasePaymentForm } from "@/products";
import type { EnvironmentConfig, FormField, FieldName, FieldState, FinixTokenResponse, FormOptions, FormState, IframeMessage } from "@/interfaces/types";

export class BankPaymentForm extends BasePaymentForm<"bank"> {
  private options: FormOptions<"bank">;
  private fields: Array<FormField<"bank", boolean>> = [];

  constructor(environment: EnvironmentConfig, options: FormOptions<"bank">) {
    super(environment);
    this.options = options;
    this.initializeFields();
    this.initializeFormState();
  }

  protected createBaseFields(): Array<FormField<"bank", false>> {
    return [
      {
        formId: this.formId,
        type: "account_number",
        paymentInstrumentType: "BANK_ACCOUNT",
        styles: this.options.styles || {},
        placeholder: {
          text: this.options.placeholders?.account_number || "Account Number",
        },
      },
      {
        formId: this.formId,
        type: "bank_code",
        paymentInstrumentType: "BANK_ACCOUNT",
        styles: this.options.styles || {},
        placeholder: {
          text: this.options.placeholders?.bank_code || "Routing Number",
        },
      },
      {
        formId: this.formId,
        type: "account_type",
        paymentInstrumentType: "BANK_ACCOUNT",
        styles: this.options.styles || {},
        placeholder: {
          text: this.options.placeholders?.account_type || "Account Type",
        },
      },
    ];
  }

  protected createAddressFields(): Array<FormField<"bank", true>> {
    if (!this.options.showAddress) {
      throw new Error("createAddressFields called when showAddress is false");
    }

    return [
      {
        formId: this.formId,
        type: "address_line1",
        paymentInstrumentType: "BANK_ACCOUNT",
        styles: this.options.styles || {},
        placeholder: {
          text: this.options.placeholders?.address_line1 || "Address Line 1",
        },
      },
      {
        formId: this.formId,
        type: "address_line2",
        paymentInstrumentType: "BANK_ACCOUNT",
        styles: this.options.styles || {},
        placeholder: {
          text: this.options.placeholders?.address_line2 || "Address Line 2",
        },
      },
      {
        formId: this.formId,
        type: "address_city",
        paymentInstrumentType: "BANK_ACCOUNT",
        styles: this.options.styles || {},
        placeholder: {
          text: this.options.placeholders?.address_city || "City",
        },
      },
      {
        formId: this.formId,
        type: "address_state",
        paymentInstrumentType: "BANK_ACCOUNT",
        styles: this.options.styles || {},
        placeholder: {
          text: this.options.placeholders?.address_state || "State",
        },
      },
      {
        formId: this.formId,
        type: "address_postal_code",
        paymentInstrumentType: "BANK_ACCOUNT",
        styles: this.options.styles || {},
        placeholder: {
          text: this.options.placeholders?.address_postal_code || "Postal Code",
        },
      },
      {
        formId: this.formId,
        type: "address_country",
        paymentInstrumentType: "BANK_ACCOUNT",
        styles: this.options.styles || {},
        placeholder: {
          text: this.options.placeholders?.address_country || "Country",
        },
      },
    ];
  }

  protected initializeFields(): void {
    const baseFields = this.createBaseFields();

    if (this.options.showAddress) {
      const addressFields = this.createAddressFields();
      this.fields = [...baseFields, ...addressFields];
    } else {
      this.fields = baseFields;
    }
  }

  /**
   * Initialize form state with empty values for all fields
   */
  protected initializeFormState(): void {
    const initialState: Partial<FormState> = {};

    // Initialize state for all fields
    this.fields.forEach((field) => {
      initialState[field.type as FieldName] = {
        isDirty: false,
        isFocused: false,
        errorMessages: [],
      };
    });

    this.formState = initialState as FormState;
  }

  getFormState(): FormState {
    throw new Error("Method not implemented.");
  }
  setFormState(fieldName: FieldName, state: FieldState): void {
    throw new Error("Method not implemented.");
  }
  protected createFieldConfig(fieldType: string, options: any) {
    throw new Error("Method not implemented.");
  }
  protected updateSubmitButtonState(): void {
    throw new Error("Method not implemented.");
  }

  public async submit(): Promise<FinixTokenResponse> {
    return new Promise(() => {});
  }

  public render(): void {}

  protected addFormHeader(container: HTMLElement): void {}
  protected renderFormFields(container: HTMLElement): void {}
  protected addSubmitButton(container: HTMLElement): void {}
  protected handleMessage(message: IframeMessage): void {}
}
