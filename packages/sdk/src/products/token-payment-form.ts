import { BasePaymentForm } from "./base-payment-form";
import { getVisibleFields } from "@/types";
import { createIframeFieldConfig, getDefaultFieldProps, generateTimestampedId } from "@/utils";
import { DEFAULT_CARD_FIELD_STATE, DEFAULT_BANK_FIELD_STATE, DEFAULT_ADDRESS_FIELD_STATE, IFRAME_URL } from "@/constants";

import type { EnvironmentConfig, FormConfig, FieldName, FieldState, FinixTokenResponse, FormState, IframeMessage, PaymentInstrumentType, AvailableFieldNames, HideableField } from "@/types";

export class TokenPaymentForm extends BasePaymentForm<"token"> {
  // --- Token Form Specific State ---
  private selectedDisplayType: "card" | "bank" = "card"; // Default to showing card fields
  private fieldsContainer: HTMLElement | null = null; // Reference to the container for fields
  private paymentInstrumentType: PaymentInstrumentType<"token"> = "PAYMENT_CARD";

  constructor(environment: EnvironmentConfig, formConfig: FormConfig<"token">) {
    super(environment, formConfig);
    // Initialize state for the default display type ('card')
    this._initializeStateForDisplayType(this.selectedDisplayType);
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
    const messageId = generateTimestampedId("msg-");
    const promise = new Promise<FinixTokenResponse>((resolve, reject) => {
      this.submissionPromises.set(messageId, { resolve, reject });
    });

    const payload = {
      environment: this.environment.environment,
      applicationId: this.environment.applicationId,
      ...(this.environment.fraudSessionId && { fraudSessionId: this.environment.fraudSessionId }),
      data: {
        paymentInstrumentType: this.paymentInstrumentType, // Add current type
      },
    };

    const firstIframe = this.fields[0];
    if (!firstIframe?.contentWindow) {
      throw new Error("Target iframe for submission not found");
    }

    firstIframe.contentWindow.postMessage(
      {
        messageId: messageId,
        messageName: "submit",
        messageData: payload,
      },
      "https://js.finix.com",
    );

    this.config.callbacks?.onSubmit?.(payload);
    return promise;
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
    cardButton.id = `${this.formId}-toggle-card`;
    cardButton.className = "finix-button finix-card-button active"; // Card is active by default
    cardButton.type = "button";
    cardButton.innerHTML = "<span>Card</span>"; // Simple text for now
    cardButton.onclick = () => this._switchToPaymentType("card", cardButton, bankButton);

    const bankButton = document.createElement("button");
    bankButton.id = `${this.formId}-toggle-bank`;
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
    // Update the payment instrument type property
    this.paymentInstrumentType = type === "card" ? "PAYMENT_CARD" : "BANK_ACCOUNT";

    // Update button styles
    cardBtn.classList.toggle("active", type === "card");
    bankBtn.classList.toggle("active", type === "bank");

    // Re-initialize the form state for the new type using the new dedicated method
    this._initializeStateForDisplayType(type);

    // Clear current fields and re-render
    if (this.fieldsContainer) {
      this.renderFormFields(this.fieldsContainer);
    }

    // After re-rendering and state reset, update submit button based on new state validity
    this.updateSubmitButtonState(this._checkFormValidity());
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

      // Determine the specific types for the current rendering context
      const currentFieldsType = fieldsToRenderType; // 'card' or 'bank'
      const currentPaymentType = currentFieldsType === "card" ? "PAYMENT_CARD" : "BANK_ACCOUNT";

      // Remove the previous cast. createIframeFieldConfig now handles ConfigT vs RenderT.
      // Generics <ConfigT, RenderT, S> will be inferred.
      // ConfigT = 'token', RenderT = 'card' | 'bank', S = boolean
      const fieldConfig = createIframeFieldConfig(
        fieldName,
        this.formId,
        this.config, // Pass FormConfig<'token'> directly
        currentPaymentType, // Pass PaymentInstrumentType<'card' | 'bank'>
      );

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
    const showAddress = !!this.config.showAddress;

    if (showAddress) {
      if (country === "USA") {
        stateWrapper?.style.setProperty("display", "block");
        regionWrapper?.style.setProperty("display", "none");
      } else {
        stateWrapper?.style.setProperty("display", "none");
        regionWrapper?.style.setProperty("display", "block");
      }
    } else {
      // Ensure both are hidden if showAddress is false
      stateWrapper?.style.setProperty("display", "none");
      regionWrapper?.style.setProperty("display", "none");
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

  /**
   * Initializes/Resets the form state specifically for the given display type (card or bank).
   * This is used by TokenPaymentForm during initial load and toggling.
   * @param displayType The type of form to initialize state for ('card' or 'bank').
   */
  private _initializeStateForDisplayType(displayType: "card" | "bank"): void {
    // Determine the correct base default state based on the provided displayType
    let baseDefaultState: Partial<Record<FieldName, FieldState>>;
    switch (displayType) {
      case "card":
        baseDefaultState = DEFAULT_CARD_FIELD_STATE;
        break;
      case "bank":
        baseDefaultState = DEFAULT_BANK_FIELD_STATE;
        break;
    }

    const showAddress = !!this.config.showAddress;
    const fullDefaultState: Partial<Record<FieldName, FieldState>> = showAddress ? { ...baseDefaultState, ...DEFAULT_ADDRESS_FIELD_STATE } : baseDefaultState;

    const visibleFields = getVisibleFields({
      paymentType: displayType,
      hideFields: this.config.hideFields as HideableField<typeof displayType, boolean>[],
      showAddress: showAddress,
    });
    const visibleFieldsSet = new Set<AvailableFieldNames<typeof displayType, boolean>>(visibleFields as AvailableFieldNames<typeof displayType, boolean>[]);

    const initialVisibleState: FormState<"token", boolean> = {};
    for (const field of visibleFieldsSet) {
      const typedField = field as keyof typeof fullDefaultState;
      if (fullDefaultState[typedField]) {
        const defaultStateForField = fullDefaultState[typedField];
        const stateFieldKey = field as keyof FormState<"token", boolean>;
        initialVisibleState[stateFieldKey] = {
          ...defaultStateForField,
          errorMessages: [...defaultStateForField.errorMessages],
        };
      } else {
        const stateFieldKey = field as keyof FormState<"token", boolean>;
        initialVisibleState[stateFieldKey] = {
          isDirty: false,
          isFocused: false,
          errorMessages: [],
        };
      }
    }

    if (this.config.defaultValues) {
      for (const [field, value] of Object.entries(this.config.defaultValues)) {
        if (visibleFieldsSet.has(field as AvailableFieldNames<typeof displayType, boolean>)) {
          const typedField = field as keyof FormState<"token", boolean>;
          if (initialVisibleState[typedField]) {
            if (typeof value === "string") {
              initialVisibleState[typedField].selected = value;
            }
          }
        }
      }
    }

    this.formState = initialVisibleState;
  }

  protected _getVisibleFieldsForRender(): AvailableFieldNames<"token", boolean>[] {
    // This method seems redundant now as renderFormFields calculates its own visible fields
    // based on selectedDisplayType. We can potentially remove it or align its logic.
    // For now, return an empty array or align it:
    const { showAddress = false, hideFields = [] } = this.config;
    return getVisibleFields({
      paymentType: this.selectedDisplayType, // Use the current display type
      hideFields: hideFields as HideableField<typeof this.selectedDisplayType, boolean>[],
      showAddress,
    });
  }
}
