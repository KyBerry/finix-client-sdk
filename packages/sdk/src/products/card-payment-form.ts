import { BasePaymentForm } from "@/products";

import { getVisibleFields } from "@/types";
import { createIframeFieldConfig, getDefaultFieldProps, generateTimestampedId } from "@/utils";
import type { EnvironmentConfig, FormConfig, FieldName, FieldState, FinixTokenResponse, FormState, IframeMessage, AvailableFieldNames } from "@/types";

export class CardPaymentForm extends BasePaymentForm<"card"> {
  constructor(environment: EnvironmentConfig, formConfig: FormConfig<"card">) {
    super(environment, formConfig);
    this.initializeFormState();
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
    console.log(`CardPaymentForm - Form is valid: ${isFormValid}`);
    const submitButton = document.getElementById(`${this.formId}-submit-button`) as HTMLButtonElement | null;
    if (submitButton) {
      submitButton.disabled = !isFormValid;
    }
  }

  public async submit(): Promise<FinixTokenResponse> {
    // Use the base class method to check validity if desired (optional pre-check)
    // const isFormValid = this._checkFormValidity();
    // if (!isFormValid) {
    //   console.warn("Submit called on invalid form.");
    //   return Promise.reject(new Error("Form is invalid"));
    // }

    // 1. Generate Unique Message ID
    const messageId = generateTimestampedId("submit-");

    // 2. Create and Store Promise
    return new Promise<FinixTokenResponse>((resolve, reject) => {
      this.submissionPromises.set(messageId, { resolve, reject });

      // 3. Find Target Iframe (use first field as per finix.js)
      const targetIframe = this.fields[0];
      if (!targetIframe?.contentWindow) {
        this.submissionPromises.delete(messageId); // Clean up stored promise
        return reject(new Error("Target iframe for submission not found or not accessible."));
      }

      // 4. Construct Message Payload
      const messagePayload = {
        messageId: messageId,
        messageName: "submit",
        messageData: {
          // Include necessary env details from the mutable environment
          environment: this.environment.environment,
          applicationId: this.environment.applicationId,
          // Add fraudSessionId if available
          ...(this.environment.fraudSessionId && { fraudSessionId: this.environment.fraudSessionId }),
          // Include other data if needed by the specific iframe endpoint
          data: {}, // As per finix.js simple submit call
        },
      };

      // 5. Send Message
      // Use the specific origin for better security if known, otherwise '*' is fallback
      const targetOrigin = "https://js.finix.com"; // TODO: Confirm this is the correct/stable origin
      targetIframe.contentWindow.postMessage(messagePayload, targetOrigin);

      // 6. Trigger onSubmit Callback (Optional)
      this.config.callbacks?.onSubmit?.(messagePayload); // Pass payload for context?
    });
  }

  protected addFormHeader(container: HTMLElement): void {}

  protected initializeFields(): void {}

  protected _getVisibleFieldsForRender(): AvailableFieldNames<"card", boolean>[] {
    const { showAddress = false, hideFields = [] } = this.config as FormConfig<"card", boolean>;
    return getVisibleFields({ paymentType: "card", hideFields, showAddress });
  }

  protected renderFormFields(container: HTMLElement): void {
    const visibleFields = this._getVisibleFieldsForRender();
    const { showAddress = false } = this.config;

    container.innerHTML = "";
    this.fields = [];

    if (!Array.isArray(visibleFields)) {
      console.error("visibleFields is not an array in renderFormFields:", visibleFields);
      return;
    }

    visibleFields.forEach((fieldName) => {
      const fieldDefaults = getDefaultFieldProps(fieldName);
      const fieldConfig = createIframeFieldConfig(fieldName, this.formId, this.config, "PAYMENT_CARD");

      const wrapper = document.createElement("div");
      const wrapperId = `${this.formId}-field-wrapper-${fieldName}`;
      wrapper.id = wrapperId;
      wrapper.className = wrapperId;

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

      container.appendChild(wrapper);

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

  protected handleMessage(message: IframeMessage): void {
    // Call base handler first
    super.handleMessage(message);
    // Add any card-specific message handling if needed
  }

  /**
   * Handles showing/hiding State vs Region fields based on country.
   * @param country The uppercase country code (e.g., "USA")
   */
  protected _handleCountryChange(country: string): void {
    const stateWrapperId = `${this.formId}-field-wrapper-address_state`;
    const regionWrapperId = `${this.formId}-field-wrapper-address_region`;
    const stateWrapper = document.getElementById(stateWrapperId);
    const regionWrapper = document.getElementById(regionWrapperId);

    if (country === "USA") {
      if (stateWrapper) stateWrapper.style.display = "block";
      if (regionWrapper) regionWrapper.style.display = "none";
    } else {
      if (stateWrapper) stateWrapper.style.display = "none";
      if (regionWrapper) regionWrapper.style.display = "block";
    }
  }
}
