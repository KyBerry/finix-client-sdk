import { BasePaymentForm } from "@/products";

import { getVisibleFields } from "@/types";
import type { EnvironmentConfig, FormConfig, FieldName, FieldState, FinixTokenResponse, FormState, IframeMessage } from "@/types";

export class CardPaymentForm extends BasePaymentForm<"card"> {
  private formState: FormState<"card", boolean> = {};

  constructor(environment: EnvironmentConfig, formConfig: FormConfig<"card">) {
    super(environment, formConfig);
    this.initializeFields();
    this.initializeFormState();
  }

  protected initializeFields(): void {
    // We're extending BasePaymentForm which has fields as HTMLIFrameElement[]
    // This method should prepare or configure but not store the field configs
    // The field configurations will be created during rendering
  }

  protected initializeFormState(): void {
    const visibleFields = getVisibleFields({
      paymentType: this.config.paymentType,
      hideFields: this.config.hideFields,
      showAddress: this.config.showAddress,
    });

    for (const fieldId of visibleFields) {
      this.formState[fieldId] = {
        isDirty: false,
        isFocused: false,
        errorMessages: [],
      };
    }
  }

  getFormState(): FormState {
    return this.formState;
  }

  setFormState(fieldName: FieldName, state: FieldState): void {
    // Only update state for fields that exist in the form
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
