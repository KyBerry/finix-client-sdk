import { BasePaymentForm } from "@/products";

import { getVisibleFields } from "@/types";
import { createIframeFieldConfig, getDefaultFieldProps, generateTimestampedId } from "@/utils";
import { IFRAME_URL } from "@/constants";
import type { EnvironmentConfig, FormConfig, FieldName, FieldState, FinixTokenResponse, FormState, IframeMessage, PaymentInstrumentType, AvailableFieldNames, Placeholder } from "@/types";

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

  protected updateSubmitButtonState(isFormValid: boolean): void {
    console.log(`BankPaymentForm - Form is valid: ${isFormValid}`);
    const submitButton = document.getElementById(`${this.formId}-submit-button`) as HTMLButtonElement | null;
    if (submitButton) {
      submitButton.disabled = !isFormValid;
    }
  }

  public async submit(): Promise<FinixTokenResponse> {
    // 1. Generate Unique Message ID
    const messageId = generateTimestampedId("submit-");

    // 2. Create and Store Promise
    return new Promise<FinixTokenResponse>((resolve, reject) => {
      this.submissionPromises.set(messageId, { resolve, reject });

      // 3. Find Target Iframe (use first field as per finix.js)
      const targetIframe = this.fields[0];
      if (!targetIframe?.contentWindow) {
        this.submissionPromises.delete(messageId);
        return reject(new Error("Target iframe for submission not found or not accessible."));
      }

      // 4. Construct Message Payload
      const messagePayload = {
        messageId: messageId,
        messageName: "submit",
        messageData: {
          environment: this.environment.environment,
          applicationId: this.environment.applicationId,
          ...(this.environment.fraudSessionId && { fraudSessionId: this.environment.fraudSessionId }),
          data: {},
        },
      };

      // 5. Send Message
      const targetOrigin = "https://js.finix.com"; // TODO: Confirm origin
      targetIframe.contentWindow.postMessage(messagePayload, targetOrigin);

      // 6. Trigger onSubmit Callback (Optional)
      this.config.callbacks?.onSubmit?.(messagePayload);
    });
  }

  protected addFormHeader(container: HTMLElement): void {}

  protected initializeFields(): void {}

  protected _getVisibleFieldsForRender(): AvailableFieldNames<"bank", boolean>[] {
    const { showAddress = false, hideFields = [] } = this.config as FormConfig<"bank", boolean>;
    return getVisibleFields({ paymentType: "bank", hideFields, showAddress });
  }

  protected renderFormFields(form: HTMLElement): void {
    const visibleFields = this._getVisibleFieldsForRender();
    const { showAddress = false } = this.config; // Define showAddress

    form.innerHTML = "";
    this.fields = [];

    if (!Array.isArray(visibleFields)) {
      console.error("visibleFields is not an array in BankPaymentForm renderFormFields:", visibleFields);
      return;
    }

    visibleFields.forEach((fieldName) => {
      const fieldDefaults = getDefaultFieldProps(fieldName);
      const fieldConfig = createIframeFieldConfig(fieldName, this.formId, this.config, "BANK_ACCOUNT");

      const wrapper = document.createElement("div");
      const wrapperId = `${this.formId}-field-wrapper-${fieldName}`;
      wrapper.id = wrapperId;
      wrapper.className = `${this.formId}-field-wrapper ${wrapperId}`;

      if (this.config.showLabels) {
        const label = document.createElement("label");
        label.htmlFor = `${this.formId}-${fieldName}-iframe`;
        label.textContent = this.config.labels?.[fieldName] ?? fieldDefaults.defaultLabel ?? fieldName;
        wrapper.appendChild(label);
      }

      const iframeContainer = document.createElement("div");
      iframeContainer.id = `${this.formId}-${fieldName}-iframe`;
      iframeContainer.className = `field ${fieldName}`;

      const iframe = document.createElement("iframe");
      iframe.setAttribute("data-field-name", fieldName);
      const encodedConfig = btoa(JSON.stringify(fieldConfig));
      iframe.src = `https://js.finix.com/v/1/payment-fields/index.html?${encodedConfig}`;
      iframe.style.border = "none";
      iframe.style.width = "100%";
      iframe.style.height = "50px";

      iframeContainer.appendChild(iframe);
      wrapper.appendChild(iframeContainer);

      const validationSpan = document.createElement("span");
      validationSpan.id = `${this.formId}-${fieldName}-validation`;
      validationSpan.className = `${fieldName}_validation validation`;
      wrapper.appendChild(validationSpan);

      form.appendChild(wrapper);
      this.fields.push(iframe);
    });

    this._handleCountryChange(this.formState?.address_country?.selected?.toUpperCase() ?? "USA");
  }

  protected addSubmitButton(container: HTMLElement): void {
    const button = document.createElement("button");
    button.id = `${this.formId}-submit-button`;
    button.type = "submit";
    button.textContent = this.config.submitLabel || "Submit Payment";
    button.disabled = true;

    button.onclick = (event) => {
      event.preventDefault();
      this.submit();
    };

    button.style.width = "100%";
    button.style.padding = "10px";
    button.style.marginTop = "15px";
    button.style.border = "none";
    button.style.borderRadius = "4px";
    button.style.backgroundColor = "#007bff";
    button.style.color = "white";
    button.style.cursor = "pointer";

    container.appendChild(button);
  }

  // Override handleMessage ONLY if bank-specific logic is needed *after* base handling
  // protected handleMessage(message: IframeMessage): void {
  //   super.handleMessage(message);
  //   // Add bank-specific logic here
  // }

  /**
   * Handles showing/hiding bank fields based on the selected country.
   * E.g., Shows transit/institution for CAN, bank_code for USA/others.
   * @param country The uppercase country code (e.g., "USA", "CAN")
   */
  protected _handleCountryChange(country: string): void {
    const getWrapper = (field: string): HTMLElement | null => {
      // Use querySelector for consistency with test approach, might need adjustment
      // if renderFormFields uses getElementById internally
      const selector = `.${this.formId}-field-wrapper-${field}`;
      // Check if element exists in the container where fields are rendered
      // Assuming renderFormFields appends to this.formContainer or similar
      const container = document.getElementById(this.formId + "-container"); // Need a reliable way to get the container
      // return container?.querySelector(selector);
      // Safer approach: use getElementById if IDs are consistently set
      return document.getElementById(`${this.formId}-field-wrapper-${field}`);
    };

    const bankCodeWrapper = getWrapper("bank_code");
    const transitWrapper = getWrapper("transit_number");
    const institutionWrapper = getWrapper("institution_number");

    // Handle State vs Region (relevant for both card and bank if address shown)
    const stateWrapper = getWrapper("address_state");
    const regionWrapper = getWrapper("address_region");
    const showAddress = !!this.config.showAddress;

    if (showAddress) {
      if (country === "USA") {
        if (stateWrapper) stateWrapper.style.display = "block";
        if (regionWrapper) regionWrapper.style.display = "none";
      } else {
        if (stateWrapper) stateWrapper.style.display = "none";
        if (regionWrapper) regionWrapper.style.display = "block";
      }
    } else {
      // Ensure both are hidden if showAddress is false
      if (stateWrapper) stateWrapper.style.display = "none";
      if (regionWrapper) regionWrapper.style.display = "none";
    }

    // Handle Bank fields
    if (country === "CAN") {
      if (bankCodeWrapper) bankCodeWrapper.style.display = "none";
      if (transitWrapper) transitWrapper.style.display = "block";
      if (institutionWrapper) institutionWrapper.style.display = "block";
    } else {
      // Default to USA/other behavior
      if (bankCodeWrapper) bankCodeWrapper.style.display = "block";
      // Explicitly hide CAN fields when not CAN
      if (transitWrapper) transitWrapper.style.display = "none";
      if (institutionWrapper) institutionWrapper.style.display = "none";
    }
  }
}
