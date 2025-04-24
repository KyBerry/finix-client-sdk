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

  protected renderFormFields(container: HTMLElement): void {
    const showAddress = !!this.config.showAddress;
    const showLabels = !!this.config.showLabels;

    const visibleFields = getVisibleFields({
      paymentType: "bank",
      hideFields: this.config.hideFields,
      showAddress: showAddress,
    }) as AvailableFieldNames<"bank", typeof showAddress>[];

    const paymentType: PaymentInstrumentType<"bank"> = "BANK_ACCOUNT";

    this.fields = [];

    visibleFields.forEach((fieldName) => {
      const fieldDefaults = getDefaultFieldProps(fieldName);
      const fieldConfig = createIframeFieldConfig<"bank", typeof showAddress>(fieldName, this.formId, this.config, paymentType);

      const encodedConfig = btoa(JSON.stringify(fieldConfig));
      const iframeUrl = `${IFRAME_URL}${encodedConfig}`;

      const fieldWrapper = document.createElement("div");
      fieldWrapper.className = `${this.formId}-field-wrapper ${this.formId}-field-wrapper-${fieldName}`;

      if (showLabels) {
        const label = document.createElement("label");
        label.htmlFor = `${this.formId}-${fieldName}-iframe`;
        label.textContent = this.config.labels?.[fieldName] || fieldDefaults.defaultLabel || fieldName;
        fieldWrapper.appendChild(label);
      }

      const iframe = document.createElement("iframe");
      iframe.src = iframeUrl;
      iframe.id = `${this.formId}-${fieldName}-iframe`;
      iframe.style.border = "none";
      iframe.style.width = "100%";
      iframe.style.height = "50px";
      iframe.setAttribute("data-field-name", fieldName);

      fieldWrapper.appendChild(iframe);

      const validationMsg = document.createElement("span");
      validationMsg.id = `${this.formId}-${fieldName}-validation`;
      validationMsg.className = "validation-message";
      validationMsg.style.color = "red";
      validationMsg.style.fontSize = "0.8em";
      validationMsg.style.display = "block";
      fieldWrapper.appendChild(validationMsg);

      container.appendChild(fieldWrapper);
      this.fields.push(iframe);
    });
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
    // Helper to get wrapper and cast to HTMLElement
    const getWrapper = (field: FieldName): HTMLElement | null => document.querySelector(`.${this.formId}-field-wrapper-${field}`);

    // Note: Assumes wrappers have class like "formId-field-wrapper-fieldName"
    // Update renderFormFields to add this class if needed.
    const bankCodeWrapper = getWrapper("bank_code");
    const transitWrapper = getWrapper("transit_number");
    const institutionWrapper = getWrapper("institution_number");

    if (country === "CAN") {
      bankCodeWrapper?.style.setProperty("display", "none");
      transitWrapper?.style.setProperty("display", "block");
      institutionWrapper?.style.setProperty("display", "block");
    } else {
      bankCodeWrapper?.style.setProperty("display", "block");
      transitWrapper?.style.setProperty("display", "none");
      institutionWrapper?.style.setProperty("display", "none");
    }

    // Also handle State vs Region if address is shown
    // TODO: Need to know the actual FieldName used for the non-US region field.
    // Assuming 'address_region' for now based on finix.js
    const stateWrapper = getWrapper("address_state");
    const regionWrapper = getWrapper("address_region");
    if (country === "USA") {
      stateWrapper?.style.setProperty("display", "block");
      regionWrapper?.style.setProperty("display", "none");
    } else {
      stateWrapper?.style.setProperty("display", "none");
      regionWrapper?.style.setProperty("display", "block");
    }
  }
}
