import { BasePaymentForm } from "@/products";
import { getVisibleFields } from "@/types";
import { createIframeFieldConfig } from "@/utils";
import { IFRAME_URL } from "@/constants";
import type { EnvironmentConfig, FormConfig, FieldName, FieldState, FinixTokenResponse, FormState, IframeMessage, PaymentInstrumentType, AvailableFieldNames } from "@/types";

export class TokenPaymentForm extends BasePaymentForm<"token"> {
  constructor(environment: EnvironmentConfig, formConfig: FormConfig<"token">) {
    super(environment, formConfig);
  }

  // --- Implement Abstract Methods ---

  getFormState(): FormState {
    return this.formState;
  }

  setFormState(fieldName: FieldName, state: FieldState): void {
    const typedField = fieldName as keyof typeof this.formState;
    if (this.formState[typedField] !== undefined) {
      this.formState[typedField] = state;
    } else {
      console.warn(`Attempted to set state for non-existent token field: ${fieldName}`);
    }
  }

  async submit(): Promise<FinixTokenResponse> {
    // TODO: Implement token form submission logic
    // This might involve determining if it's card or bank data and calling the appropriate Finix API endpoint
    // For now, return an empty promise or throw error.
    console.log("TokenPaymentForm.submit() not implemented.");
    return Promise.reject("Not implemented");
  }

  protected updateSubmitButtonState(): void {
    // TODO: Implement logic to enable/disable submit button based on form validity
    console.log("TokenPaymentForm.updateSubmitButtonState() not implemented.");
  }

  protected initializeFields(): void {
    // Empty implementation, handled in renderFormFields
  }

  protected addFormHeader(container: HTMLElement): void {
    // Optional: Add specific header for token form
    const header = document.createElement("h3");
    header.textContent = "Enter Payment Details"; // Example header
    container.appendChild(header);
  }

  protected renderFormFields(container: HTMLElement): void {
    const showAddress = !!this.config.showAddress;

    const visibleFields = getVisibleFields({
      paymentType: "token",
      hideFields: this.config.hideFields,
      showAddress: showAddress,
    }) as AvailableFieldNames<"token", typeof showAddress>[];

    // PaymentInstrumentType for token can be either, but iframe needs one.
    // The underlying iframe might determine type based on BIN or routing number.
    // We might need to adjust this based on how finix.js handles tokens.
    // For now, let's default to PAYMENT_CARD and assume the iframe logic handles it.
    // Alternatively, maybe the iframe needs a specific 'token' type?
    // Revisit this if tokenization fails.
    const paymentType: PaymentInstrumentType<"token"> = "PAYMENT_CARD"; // Or maybe BANK_ACCOUNT? Or a specific token type?

    this.fields = []; // Clear existing fields

    visibleFields.forEach((fieldName) => {
      const fieldConfig = createIframeFieldConfig<"token", typeof showAddress>(fieldName, this.formId, this.config, paymentType);

      const encodedConfig = btoa(JSON.stringify(fieldConfig));
      const iframeUrl = `${IFRAME_URL}${encodedConfig}`;

      const iframe = document.createElement("iframe");
      iframe.src = iframeUrl;
      iframe.style.border = "none";
      iframe.style.width = "100%";
      iframe.style.height = "50px"; // Adjust height as needed
      iframe.setAttribute("data-field-name", fieldName);

      container.appendChild(iframe);
      this.fields.push(iframe);
    });
  }

  protected addSubmitButton(container: HTMLElement): void {
    // TODO: Add submit button specific to token form if needed
    const button = document.createElement("button");
    button.textContent = this.config.submitLabel || "Submit Payment";
    button.onclick = () => this.submit(); // Attach submit handler
    // Add logic to disable button initially or based on state
    container.appendChild(button);
  }

  protected handleMessage(message: IframeMessage): void {
    // TODO: Implement message handling specific to token form if necessary
    // Update state based on 'field-updated', trigger submit on 'form-submit', handle BIN info
    console.log("Token form received message:", message);
    // Example state update:
    // if (message.messageName === 'field-updated') {
    //   const data = message.messageData as { name: FieldName; state: FieldState };
    //   this.setFormState(data.name, data.state);
    //   this.updateSubmitButtonState();
    // }
    // Need to call super.handleMessage or replicate its logic if BasePaymentForm handles common messages.
  }
}
