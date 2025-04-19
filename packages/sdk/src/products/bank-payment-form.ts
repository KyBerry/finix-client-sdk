import { BasePaymentForm } from "@/products";
import type { EnvironmentConfig, FormConfig, FieldName, FieldState, FinixTokenResponse, FormState, IframeMessage } from "@/interfaces/types";

export class BankPaymentForm extends BasePaymentForm {
  private formConfig: FormConfig<"bank">;

  constructor(environment: EnvironmentConfig, formConfig: FormConfig<"bank">) {
    super(environment, formConfig);
    this.formConfig = formConfig;
    this.initializeFields();
    this.initializeFormState();
  }

  protected initializeFields(): void {}

  /**
   * Initialize form state with empty values for all fields
   */
  protected initializeFormState(): void {
    const initialState: Partial<FormState> = {};

    // Initialize state for all fields
    // this.fields.forEach((field) => {
    //   initialState[field.type as FieldName] = {
    //     isDirty: false,
    //     isFocused: false,
    //     errorMessages: [],
    //   };
    // });

    // this.formState = initialState as FormState;
  }

  getFormState(): FormState {
    throw new Error("Method not implemented.");
  }
  setFormState(fieldName: FieldName, state: FieldState): void {
    throw new Error("Method not implemented.");
  }
  protected createFieldConfig(fieldType: string, formConfig: any) {
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
