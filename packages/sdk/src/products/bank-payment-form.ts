import { BasePaymentForm } from "@/products";

import { getVisibleFields } from "@/types";
import { createIframeFieldConfig } from "@/utils";
import { IFRAME_URL } from "@/constants";
import type { EnvironmentConfig, FormConfig, FieldName, FieldState, FinixTokenResponse, FormState, IframeMessage, PaymentInstrumentType, AvailableFieldNames } from "@/types";

export class BankPaymentForm extends BasePaymentForm<"bank"> {
  constructor(environment: EnvironmentConfig, formConfig: FormConfig<"bank">) {
    super(environment, formConfig);
  }

  getFormState(): FormState {
    return this.formState;
  }

  setFormState(fieldName: FieldName, state: FieldState): void {
    const typedField = fieldName as keyof typeof this.formState;
    if (this.formState[typedField] !== undefined) {
      this.formState[typedField] = state;
    } else {
      console.warn(`Attempted to set state for non-existent field: ${fieldName}`);
    }
  }

  protected updateSubmitButtonState(): void {
    throw new Error("Method not implemented.");
  }

  public async submit(): Promise<FinixTokenResponse> {
    return new Promise(() => {});
  }

  protected addFormHeader(container: HTMLElement): void {}

  protected initializeFields(): void {}

  protected renderFormFields(container: HTMLElement): void {
    const showAddress = !!this.config.showAddress;

    const visibleFields = getVisibleFields({
      paymentType: "bank",
      hideFields: this.config.hideFields,
      showAddress: showAddress,
    }) as AvailableFieldNames<"bank", typeof showAddress>[];

    const paymentType: PaymentInstrumentType<"bank"> = "BANK_ACCOUNT";

    this.fields = [];

    visibleFields.forEach((fieldName) => {
      const fieldConfig = createIframeFieldConfig<"bank", typeof showAddress>(fieldName, this.formId, this.config, paymentType);

      const encodedConfig = btoa(JSON.stringify(fieldConfig));
      const iframeUrl = `${IFRAME_URL}${encodedConfig}`;

      const iframe = document.createElement("iframe");
      iframe.src = iframeUrl;
      iframe.style.border = "none";
      iframe.style.width = "100%";
      iframe.style.height = "50px";
      iframe.setAttribute("data-field-name", fieldName);

      container.appendChild(iframe);
      this.fields.push(iframe);
    });
  }

  protected addSubmitButton(container: HTMLElement): void {}
  protected handleMessage(message: IframeMessage): void {}
}
