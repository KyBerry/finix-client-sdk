import { BasePaymentForm } from "@/products";
import { getVisibleFields } from "@/types";
import { createIframeFieldConfig, getDefaultFieldProps, generateTimestampedId } from "@/utils";
import { IFRAME_URL } from "@/constants";
import type { EnvironmentConfig, FormConfig, FieldName, FieldState, FinixTokenResponse, FormState, IframeMessage, PaymentInstrumentType, AvailableFieldNames, Placeholder, FormType, HideableField } from "@/types";

export class TokenPaymentForm extends BasePaymentForm<"token"> {
  // --- Token Form Specific State ---
  private selectedDisplayType: "card" | "bank" = "card"; // Default to showing card fields
  private fieldsContainer: HTMLElement | null = null; // Reference to the container for fields

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
    // 1. Generate Unique Message ID
    const messageId = generateTimestampedId("submit-");

    // 2. Create and Store Promise
    return new Promise<FinixTokenResponse>((resolve, reject) => {
      this.submissionPromises.set(messageId, { resolve, reject });

      // 3. Find Target Iframe (Using first field - needs verification for token forms)
      // TODO: Verify which iframe should receive the submit message for token forms.
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

  protected updateSubmitButtonState(isFormValid: boolean): void {
    console.log(`TokenPaymentForm - Form is valid: ${isFormValid}`);
    const submitButton = document.getElementById(`${this.formId}-submit-button`) as HTMLButtonElement | null;
    if (submitButton) {
      submitButton.disabled = !isFormValid;
    }
  }

  protected initializeFields(): void {
    // Empty implementation, handled in renderFormFields
  }

  protected addFormHeader(container: HTMLElement): void {
    // Create the Card/Bank toggle buttons container
    const toggleContainer = document.createElement("div");
    toggleContainer.className = "finix-payment-type-toggle"; // Add class for styling

    const cardButton = document.createElement("button");
    cardButton.id = `${this.formId}-card-toggle`;
    cardButton.className = "finix-button finix-card-button active"; // Card is active by default
    cardButton.type = "button";
    cardButton.innerHTML = "<span>Card</span>"; // Simple text for now
    cardButton.onclick = () => this._switchToPaymentType("card", cardButton, bankButton);

    const bankButton = document.createElement("button");
    bankButton.id = `${this.formId}-bank-toggle`;
    bankButton.className = "finix-button finix-bank-button";
    bankButton.type = "button";
    bankButton.innerHTML = "<span>Bank Account</span>";
    bankButton.onclick = () => this._switchToPaymentType("bank", cardButton, bankButton);

    toggleContainer.appendChild(cardButton);
    toggleContainer.appendChild(bankButton);

    // Create a dedicated container for fields below the toggle
    this.fieldsContainer = document.createElement("div");
    this.fieldsContainer.className = "finix-fields-container";

    // Append toggle and fields container to the main form container
    container.appendChild(toggleContainer);
    container.appendChild(this.fieldsContainer);
  }

  // --- Token Form Specific Methods ---
  private _switchToPaymentType(type: "card" | "bank", cardBtn: HTMLButtonElement, bankBtn: HTMLButtonElement): void {
    if (this.selectedDisplayType === type) return; // Already selected

    this.selectedDisplayType = type;

    // Update button styles
    cardBtn.classList.toggle("active", type === "card");
    bankBtn.classList.toggle("active", type === "bank");

    // Clear current fields and re-render
    if (this.fieldsContainer) {
      this.renderFormFields(this.fieldsContainer);
    }
  }

  protected renderFormFields(container: HTMLElement): void {
    // Ensure container is the dedicated one for fields
    if (!this.fieldsContainer) {
      console.error("Fields container not initialized for TokenPaymentForm");
      return;
    }
    this.fieldsContainer.innerHTML = ""; // Clear previous fields

    const showAddress = !!this.config.showAddress;
    const showLabels = !!this.config.showLabels;

    // Determine which fields to show based on the toggle state
    const fieldsToRenderType = this.selectedDisplayType;

    const visibleFields = getVisibleFields({
      paymentType: fieldsToRenderType, // Use selected type
      hideFields: this.config.hideFields as HideableField<typeof fieldsToRenderType, boolean>[],
      showAddress: showAddress,
    }) as AvailableFieldNames<typeof fieldsToRenderType, typeof showAddress>[];

    // Determine PaymentInstrumentType based on selected toggle
    const paymentType: PaymentInstrumentType<"card" | "bank"> = fieldsToRenderType === "card" ? "PAYMENT_CARD" : "BANK_ACCOUNT";

    this.fields = []; // Clear existing fields array in base class

    visibleFields.forEach((fieldName) => {
      const fieldDefaults = getDefaultFieldProps(fieldName);
      const fieldConfig = createIframeFieldConfig<typeof fieldsToRenderType, typeof showAddress>(fieldName, this.formId, this.config as unknown as FormConfig<typeof fieldsToRenderType, typeof showAddress>, paymentType);

      const encodedConfig = btoa(JSON.stringify(fieldConfig));
      const iframeUrl = `${IFRAME_URL}${encodedConfig}`;

      // Create field wrapper
      const fieldWrapper = document.createElement("div");
      fieldWrapper.className = `${this.formId}-field-wrapper ${this.formId}-field-wrapper-${fieldName}`;

      // Add label if configured
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

      // Add iframe to wrapper
      fieldWrapper.appendChild(iframe);

      // Add validation message placeholder
      const validationMsg = document.createElement("span");
      validationMsg.id = `${this.formId}-${fieldName}-validation`;
      validationMsg.className = "validation-message";
      validationMsg.style.color = "red";
      validationMsg.style.fontSize = "0.8em";
      validationMsg.style.display = "block";
      fieldWrapper.appendChild(validationMsg);

      // Append wrapper to container
      this.fieldsContainer?.appendChild(fieldWrapper);

      this.fields.push(iframe);
    });
  }

  protected addSubmitButton(container: HTMLElement): void {
    const button = document.createElement("button");
    button.id = `${this.formId}-submit-button`;
    button.type = "submit";
    button.textContent = this.config.submitLabel || "Submit Payment";
    button.disabled = true; // Initially disabled

    button.onclick = (event) => {
      event.preventDefault();
      this.submit();
    };

    // Basic Styling (consider moving to CSS)
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
    // Call base class handler first for common processing
    super.handleMessage(message);

    // Token-specific logic can go here if needed
    console.log("Token form received message:", message);
  }

  /**
   * Handles showing/hiding fields based on country for the currently displayed form type.
   * @param country The uppercase country code (e.g., "USA", "CAN")
   */
  protected _handleCountryChange(country: string): void {
    const getWrapper = (field: FieldName): HTMLElement | null => document.querySelector(`.${this.formId}-field-wrapper-${field}`);

    // Handle State vs Region (relevant for both card and bank if address shown)
    const stateWrapper = getWrapper("address_state");
    const regionWrapper = getWrapper("address_region");
    if (country === "USA") {
      stateWrapper?.style.setProperty("display", "block");
      regionWrapper?.style.setProperty("display", "none");
    } else {
      stateWrapper?.style.setProperty("display", "none");
      regionWrapper?.style.setProperty("display", "block");
    }

    // Handle Bank fields ONLY if bank form is currently displayed
    if (this.selectedDisplayType === "bank") {
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
    }
  }
}
