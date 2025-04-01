// Core Form class that handles iframe communication
class Form {
  constructor(type, onUpdateCallback) {
    this.type = type;
    this.id = `form-${new Date().getTime()}-${Math.random()}`;
    this.fields = [];
    this.state = {};
    this.binInformation = {};

    window.addEventListener("message", (e) => {
      if (e.data.formId === this.id) {
        if (getMessageName(e) === "field-updated") {
          const data = e.data.messageData;
          this.state = Object.assign({}, this.state, {
            [data.name]: data.state,
          });
          onUpdateCallback(this.state, undefined);
        } else if (getMessageName(e) === "form-submit" && this.onSubmitHandler) {
          this.onSubmitHandler();
        } else if (getMessageName(e) === "bin-information-received") {
          this.binInformation = e.data.messageData;
          onUpdateCallback(undefined, this.binInformation);
        }
      }
    });
  }

  submitWithData(environment, applicationId, data, callback) {
    const messageId = `${new Date().getTime()}-${Math.random()}`;
    this.fields[0].contentWindow.postMessage(
      {
        messageId: messageId,
        messageName: "submit",
        messageData: {
          environment: environment,
          applicationId: applicationId,
          data: data,
        },
      },
      "*",
    );

    function messageHandler(e) {
      const messageData = e.data.messageData;
      if (e.data.messageId === messageId) {
        if (getMessageName(e) === "response-received") {
          callback(null, messageData);
          window.removeEventListener("message", messageHandler);
        } else if (getMessageName(e) === "response-error") {
          callback({ status: messageData.status }, messageData);
          window.removeEventListener("message", messageHandler);
        }
      }
    }
    window.addEventListener("message", messageHandler);
  }

  submit(environment, applicationId, callback) {
    if (!environment) {
      console.error("submit() - No environment was provided");
      return;
    }
    if (!applicationId) {
      console.error("submit() - No applicationId was provided");
      return;
    }
    this.submitWithData(environment, applicationId, {}, callback);
  }

  onSubmit(callback) {
    this.onSubmitHandler = callback;
  }

  getIframeUrl(queryString) {
    return `${IFRAME_URL}${queryString}`;
  }

  field(type, options) {
    const queryString = btoa(
      JSON.stringify(
        cleanObject({
          formId: this.id,
          type: type,
          paymentInstrumentType: PAYMENT_INSTRUMENT_TYPES[this.type],
          styles: options.styles,
          placeholder: options.placeholder,
          validations: options.validations,
          autoComplete: options.autoComplete,
          options: options.options,
          defaultOption: options.defaultOption,
          errorMessage: options.errorMessage,
          fonts: options.fonts,
          defaultValue: options.defaultValue,
        }),
      ),
    );

    const url = this.getIframeUrl(queryString);
    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.style.border = "none";
    this.fields.push(iframe);

    this.state[type] = cleanObject({
      isFocused: false,
      isDirty: false,
      errorMessages: [],
      selected: options.defaultOption,
      country: type === "address.country" ? options.defaultOption : undefined,
    });

    return iframe;
  }
}

// Auth class for handling fraud prevention and security
class Auth {
  constructor(environment = "qa", merchant_id, callback) {
    if (merchant_id && typeof merchant_id !== "string") {
      console.warn("Error: parameter merchant id must be a string");
    }

    if (callback && typeof callback !== "function") {
      console.warn("Error: parameter callback must be a function");
    }

    this.initialized = false;
    this.environment = ["qa", "sandbox", "live", "prod"].includes(environment) ? environment : "qa";

    this.defaultLibraryKeys = {
      qa: "523dfab8f5",
      sandbox: "523dfab8f5",
      live: "4ceeab9947",
      prod: "4ceeab9947",
    };

    this.api = {
      qa: "https://finix.qa-payments-api.com",
      sandbox: "https://finix.sandbox-payments-api.com",
      live: "https://finix.live-payments-api.com",
      prod: "https://finix.live-payments-api.com",
    }[environment];

    if (merchant_id && typeof merchant_id === "string") {
      if (callback && typeof callback === "function") {
        this.connect(merchant_id, callback);
      } else {
        this.connect(merchant_id);
      }
    }
  }

  getSessionKey() {
    return this.sessionKey;
  }

  initSiftLibrary(sessionKey, libraryKey, callback) {
    const self = this;
    const _sift = (window._sift = window._sift || []);

    _sift.push(["_setAccount", libraryKey]);
    _sift.push(["_setSessionId", sessionKey]);
    _sift.push(["_trackPageview"]);

    function loadScript() {
      const scriptTag = document.createElement("script");
      scriptTag.src = "https://cdn.sift.com/s.js";
      document.body.appendChild(scriptTag);

      self.initialized = true;

      if (typeof callback === "function") {
        callback(sessionKey);
      }
    }

    if (!self.initialized) {
      if (document.readyState === "complete") {
        loadScript();
      } else {
        if (window.attachEvent) {
          window.attachEvent("onload", loadScript);
        } else {
          window.addEventListener("load", loadScript, false);
        }
      }
    } else {
      if (typeof callback === "function") {
        callback(sessionKey);
      }
    }
  }

  initAuthorizationLibrary(sessionKey, libraryKey, callback) {
    this.sessionKey = sessionKey;
    this.libraryKey = libraryKey;

    this.initSiftLibrary(sessionKey, libraryKey, callback);
  }

  connect(merchant_id, callback) {
    if (merchant_id && typeof merchant_id !== "string") {
      console.warn("Error: parameter merchant id must be a string");
      return;
    }

    if (callback && typeof callback !== "function") {
      console.warn("Error: parameter callback must be a function");
    }

    const self = this;
    const fetchUrl = this.api + "/fraud/sessions?merchant_id=" + merchant_id;

    try {
      axios
        .get(fetchUrl)
        .then((response) => {
          const data = response.data;
          const sessionKey = data && data["session_id"];
          const libraryKey = data && data["sift_beacon_key"];

          if (sessionKey && libraryKey) {
            self.initAuthorizationLibrary(sessionKey, libraryKey, callback);
          } else {
            throw "Error: no session key returned";
          }
        })
        .catch(() => {
          self.initAuthorizationLibrary(`session-key-${new Date().getTime()}-${Math.random()}`, this.defaultLibraryKeys[this.environment], callback);
        });
    } catch (error) {
      self.initAuthorizationLibrary(`session-key-${new Date().getTime()}-${Math.random()}`, this.defaultLibraryKeys[this.environment], callback);
    }
  }
}

// SDK public interface
window.Finix = {
  Auth: function (environment, merchant, callback) {
    return new Auth(environment, merchant, callback);
  },

  CardTokenForm: function (elementId, options = {}) {
    if (!elementId) {
      console.error("Finix.CardTokenForm() - No elementId was provided");
      return;
    }

    if (Object.prototype.toString.call(options) !== "[object Object]") {
      console.error("Finix.CardTokenForm() - options must be an object");
      return;
    }

    if (!document.getElementById(elementId)) {
      console.error("Finix.CardTokenForm() - Could not find element with id: " + elementId);
      return;
    }

    const cleanId = elementId.replace(/[^a-zA-Z0-9-_:.]/g, "");

    // Setup container and styles
    prepareContainer(cleanId);
    createErrorContainer(cleanId);
    setupBaseStyles(cleanId);

    const onUpdate = options.onUpdate;

    // Create a new form instance
    const form = new Form("card", createUpdateHandler(onUpdate, cleanId));

    // Setup fields
    setupCardFields(form, cleanId, applyOnLoadWrapper(cleanId, options));

    return form;
  },

  BankTokenForm: function (elementId, options = {}) {
    if (!elementId) {
      console.error("Finix.BankTokenForm() - No elementId was provided");
      return;
    }

    if (Object.prototype.toString.call(options) !== "[object Object]") {
      console.error("Finix.BankTokenForm() - options must be an object");
      return;
    }

    if (!document.getElementById(elementId)) {
      console.error("Finix.BankTokenForm() - Could not find element with id: " + elementId);
      return;
    }

    const cleanId = elementId.replace(/[^a-zA-Z0-9-_:.]/g, "");

    // Setup container and styles
    prepareContainer(cleanId);
    createErrorContainer(cleanId);
    setupBaseStyles(cleanId);

    const onUpdate = options.onUpdate;

    // Create a new form instance
    const form = new Form("bank-account", createBankUpdateHandler(onUpdate, cleanId));

    // Setup fields
    setupBankFields(form, cleanId, applyOnLoadWrapper(cleanId, options));

    return form;
  },

  TokenForm: function (elementId, options = {}) {
    if (!elementId) {
      console.error("Finix.TokenForm() - No elementId was provided");
      return;
    }

    if (!document.getElementById(elementId)) {
      console.error("Finix.TokenForm() - Could not find element with id: " + elementId);
      return;
    }

    const cleanId = elementId.replace(/[^a-zA-Z0-9-_:.]/g, "");
    let currentForm;

    // Setup the toggle UI
    setupToggleUI({
      finix: this,
      elementId: cleanId,
      options: options,
      callback: (form) => {
        currentForm = form;
      },
    });

    // Start with card form by default
    currentForm = this.CardTokenForm(cleanId, options);

    // Return an interface to control the forms
    return {
      loadCardTokenForm: () => {
        currentForm = this.CardTokenForm(cleanId, options);
      },
      loadBankTokenForm: () => {
        currentForm = this.BankTokenForm(cleanId, options);
      },
      submit: function () {
        currentForm.submit.apply(currentForm, arguments);
      },
    };
  },

  // Deprecated methods
  card: function (elementId, options = {}) {
    console.error("Finix.card() has been deprecated. Please use Finix.CardTokenForm() instead.");
    return this.CardTokenForm(elementId, options);
  },

  bankAccount: function (elementId, options = {}) {
    console.error("Finix.bankAccount() has been deprecated. Please use Finix.BankTokenForm() instead.");
    return this.BankTokenForm(elementId, options);
  },
};

// Handles field updates for card forms
function createUpdateHandler(onUpdate, elementId) {
  const getElement = (selector) => {
    return document.querySelector(`#${elementId} .${selector}`);
  };

  return function (state, binInfo) {
    if (binInfo) {
      // Handle bin information (card type detection)
      const cardBrand = binInfo.cardBrand;
    }

    if (state) {
      // Update validation messages
      updateValidationMessage(state.name, getElement("name_validation"));
      updateValidationMessage(state.number, getElement("number_validation"));
      updateValidationMessage(state.expiration_date, getElement("expiration_date_validation"));
      updateValidationMessage(state.security_code, getElement("security_code_validation"));
      updateValidationMessage(state["address.line1"], getElement("address_line1_validation"));
      updateValidationMessage(state["address.line2"], getElement("address_line2_validation"));
      updateValidationMessage(state["address.city"], getElement("address_city_validation"));
      updateValidationMessage(state["address.postal_code"], getElement("address_postal_code_validation"));

      // Handle country-specific fields
      const selectedCountry = getNestedValue(state, ["address.country", "selected"], "USA");
      const regionElement = getElement("address_region");
      const stateElement = getElement("address_state");

      // Fields to exclude from validation check
      const excludedFields = [];
      if ("USA" === selectedCountry && stateElement === null) {
        excludedFields.push("address.region");
      }
      if ("USA" !== selectedCountry && regionElement === null) {
        excludedFields.push("address.region");
      }

      // Check if form has errors
      const hasErrors = hasAnyError(excludeFields(state, excludedFields), (field) => {
        const errorMessages = field.errorMessages === undefined ? [] : field.errorMessages;
        return errorMessages.length > 0;
      });

      // Update submit button state
      const submitButton = getElement("finix-submit-button");
      if (submitButton) {
        submitButton.disabled = hasErrors;
      }

      // Show/hide appropriate region field based on country
      if (state) {
        if ("USA" !== selectedCountry) {
          setElementStyle(regionElement, "display", "block");
          setElementStyle(stateElement, "display", "none");
          updateValidationMessage(state["address.region"], getElement("address_region_validation"));
        } else {
          setElementStyle(regionElement, "display", "none");
          setElementStyle(stateElement, "display", "block");
          updateValidationMessage(state["address.region"], getElement("address_state_validation"));
        }
      }
    }

    // Call user's update handler if provided
    if (typeof onUpdate === "function") {
      onUpdate(state, binInfo, hasErrors);
    }
  };
}

// Setup card form fields
function setupCardFields(form, elementId, options) {
  const { placeholders = {}, showPlaceholders = true, labels = {}, showLabels = true, showAddress = false, hideFields = [], requiredFields = [], styles = {}, onLoad, hideErrorMessages = false, errorMessages = {}, fonts, defaultValues = {} } = options;

  const defaultCountry = sanitizeText(getNestedValue(options, "defaultCountry") || getNestedValue(options, "defaultValues.address_country") || "USA");

  // Default styles
  const styleConfig = {
    default: getNestedValue(styles, "default", {
      color: "#000",
      border: "1px solid #CCCDCF",
      borderRadius: "8px",
      padding: "8px 16px",
      fontFamily: "Helvetica",
      fontSize: "16px",
      boxShadow: "0px 1px 1px rgba(0, 0, 0, 0.03), 0px 2px 4px rgba(0, 0, 0, 0.03)",
    }),
    success: getNestedValue(styles, "success", {}),
    error: getNestedValue(styles, "error", { color: "#d9534f" }),
  };

  const fieldOptions = cleanObject({ styles: styleConfig, fonts });

  // Add name field
  if (!hideFields.includes("name")) {
    createField({
      form,
      elementId,
      fieldType: "name",
      fieldHolderId: "name",
      showLabels,
      labelText: labels.card_holder_name || labels.name || "Name",
      fieldOptions: {
        ...fieldOptions,
        autoComplete: "cc-name",
        validations: "required",
        errorMessage: hideErrorMessages ? "" : errorMessages.card_holder_name || errorMessages.name || "Name is required",
        placeholder: showPlaceholders
          ? {
              text: placeholders.card_holder_name || placeholders.name || "Name",
              hideOnFocus: true,
            }
          : undefined,
        defaultValue: sanitizeText(defaultValues.card_holder_name || defaultValues.name),
      },
    });
  }

  // Add card number field
  const cardNumberField = createField({
    form,
    elementId,
    fieldType: "number",
    fieldHolderId: "number",
    showLabels,
    labelText: labels.number || "Card Number",
    fieldOptions: {
      ...fieldOptions,
      validations: "cardNumber",
      errorMessage: hideErrorMessages ? "" : errorMessages.number,
      autoComplete: "cc-number",
      placeholder: showPlaceholders
        ? {
            text: placeholders.number || "4111 1111 1111 1111",
            hideOnFocus: true,
          }
        : undefined,
    },
  });

  // Add expiration date and security code fields
  if (hideFields.includes("security_code")) {
    createField({
      form,
      elementId,
      fieldType: "expiration_date",
      fieldHolderId: "expiration_date",
      showLabels,
      labelText: labels.expiration_date || "Expiration",
      fieldOptions: {
        ...fieldOptions,
        validations: "cardExpiry",
        errorMessage: hideErrorMessages ? "" : errorMessages.expiration_date,
        autoComplete: "cc-exp",
        placeholder: showPlaceholders
          ? {
              text: placeholders.expiration_date || "MM/YYYY",
              hideOnFocus: true,
            }
          : undefined,
      },
    });
  } else {
    createFieldArray(form, elementId, [
      {
        fieldType: "expiration_date",
        fieldHolderId: "expiration_date",
        showLabels,
        labelText: labels.expiration_date || "Expiration",
        fieldOptions: {
          ...fieldOptions,
          validations: "cardExpiry",
          errorMessage: hideErrorMessages ? "" : errorMessages.expiration_date,
          autoComplete: "cc-exp",
          placeholder: showPlaceholders
            ? {
                text: placeholders.expiration_date || "MM/YYYY",
                hideOnFocus: true,
              }
            : undefined,
        },
      },
      {
        fieldType: "security_code",
        fieldHolderId: "security_code",
        showLabels,
        labelText: labels.security_code || "CVC",
        fieldOptions: {
          ...fieldOptions,
          validations: "cardCVC",
          errorMessage: hideErrorMessages ? "" : errorMessages.security_code,
          autoComplete: "cc-csc",
          placeholder: showPlaceholders
            ? {
                text: placeholders.security_code || "CVC",
                hideOnFocus: true,
              }
            : undefined,
        },
      },
    ]);
  }

  // Add address fields if enabled
  if (showAddress) {
    // Address line 1
    if (!hideFields.includes("address_line1")) {
      createField({
        form,
        elementId,
        fieldType: "address.line1",
        fieldHolderId: "address_line1",
        showLabels,
        labelText: labels.address_line1 || "Address Line 1",
        fieldOptions: {
          ...fieldOptions,
          validations: requiredFields.includes("address_line1") ? "required" : undefined,
          errorMessage: hideErrorMessages ? "" : errorMessages.address_line1 || "Address is required",
          autoComplete: "address-line1",
          placeholder: showPlaceholders
            ? {
                text: placeholders.address_line1 || "Address Line 1",
                hideOnFocus: true,
              }
            : undefined,
          defaultValue: sanitizeText(defaultValues.address_line1),
        },
      });
    }

    // Address line 2
    if (!hideFields.includes("address_line2")) {
      createField({
        form,
        elementId,
        fieldType: "address.line2",
        fieldHolderId: "address_line2",
        showLabels,
        labelText: labels.address_line2 || "Address Line 2",
        fieldOptions: {
          ...fieldOptions,
          validations: requiredFields.includes("address_line2") ? "required" : undefined,
          errorMessage: hideErrorMessages ? "" : errorMessages.address_line2 || "Address Line 2 is required",
          autoComplete: "address-line2",
          placeholder: showPlaceholders
            ? {
                text: placeholders.address_line2 || "Address Line 2",
                hideOnFocus: true,
              }
            : undefined,
          defaultValue: sanitizeText(defaultValues.address_line2),
        },
      });
    }

    // City, Region, State fields
    createFieldArray(form, elementId, [
      {
        fieldType: "address.city",
        fieldHolderId: "address_city",
        showLabels,
        labelText: labels.address_city || "City",
        fieldOptions: {
          ...fieldOptions,
          validations: requiredFields.includes("address_city") ? "required" : undefined,
          errorMessage: hideErrorMessages ? "" : errorMessages.address_city || "City is required",
          autoComplete: "address-level2",
          placeholder: showPlaceholders
            ? {
                text: placeholders.address_city || "City",
                hideOnFocus: true,
              }
            : undefined,
          defaultValue: sanitizeText(defaultValues.address_city),
        },
        hidden: hideFields.includes("address_city"),
      },
      {
        fieldType: "address.region",
        fieldHolderId: "address_region",
        showLabels,
        labelText: labels.address_region || "Region",
        fieldOptions: {
          ...fieldOptions,
          validations: requiredFields.includes("address_region") ? "required" : undefined,
          errorMessage: hideErrorMessages ? "" : errorMessages.address_region || "Region is required",
          autoComplete: "address-level1",
          placeholder: showPlaceholders
            ? {
                text: placeholders.address_region || "State",
                hideOnFocus: true,
              }
            : undefined,
          defaultValue: sanitizeText(defaultValues.address_region),
        },
        hidden: hideFields.includes("address_region"),
      },
      {
        fieldType: "address.region",
        fieldHolderId: "address_state",
        showLabels,
        labelText: labels.address_state || "State",
        fieldOptions: {
          ...fieldOptions,
          validations: requiredFields.includes("address_state") ? "required" : undefined,
          autoComplete: "address-level1",
          placeholder: showPlaceholders
            ? {
                text: placeholders.address_state || "State",
                hideOnFocus: true,
              }
            : undefined,
          options: "state",
          defaultOption: sanitizeText(defaultValues.address_state),
        },
        hidden: hideFields.includes("address_state"),
      },
    ]);
  }

  // Add postal code and country fields
  createFieldArray(
    form,
    elementId,
    showAddress
      ? [
          {
            fieldType: "address.postal_code",
            fieldHolderId: "address_postal_code",
            showLabels,
            labelText: labels.address_postal_code || "ZIP",
            fieldOptions: {
              ...fieldOptions,
              validations: requiredFields.includes("address_postal_code") ? "required" : undefined,
              errorMessage: hideErrorMessages ? "" : errorMessages.address_postal_code || "ZIP is required",
              autoComplete: "postal-code",
              placeholder: showPlaceholders
                ? {
                    text: placeholders.address_postal_code || "ZIP",
                    hideOnFocus: true,
                  }
                : undefined,
              defaultValue: sanitizeText(defaultValues.address_postal_code),
            },
            hidden: hideFields.includes("address_postal_code"),
          },
          {
            fieldType: "address.country",
            fieldHolderId: "address_country",
            showLabels,
            labelText: labels.address_country || "Country",
            fieldOptions: {
              ...fieldOptions,
              autoComplete: "country",
              placeholder: showPlaceholders
                ? {
                    text: placeholders.address_country || "Country",
                    hideOnFocus: true,
                  }
                : undefined,
              options: "country",
              defaultOption: defaultCountry,
            },
            hidden: hideFields.includes("address_country"),
          },
        ]
      : [
          {
            fieldType: "address.country",
            fieldHolderId: "address_country",
            showLabels,
            labelText: labels.address_country || "Country",
            fieldOptions: {
              ...fieldOptions,
              autoComplete: "country",
              placeholder: showPlaceholders
                ? {
                    text: placeholders.address_country || "Country",
                    hideOnFocus: true,
                  }
                : undefined,
              defaultOption: defaultCountry,
              options: "country",
            },
            hidden: true,
          },
        ],
  );

  // Setup onLoad handler
  if (typeof onLoad === "function") {
    cardNumberField.addEventListener("load", onLoad);
  }
}

// Helper function to handle bank account form updates
function createBankUpdateHandler(onUpdate, elementId) {
  const getElement = (selector) => {
    return document.querySelector(`#${elementId} .${selector}`);
  };

  return function (state, binInfo) {
    if (state) {
      // Update validation messages
      updateValidationMessage(state.name, getElement("name_validation"));
      updateValidationMessage(state.account_number, getElement("account_number_validation"));
      updateValidationMessage(state.bank_code, getElement("bank_code_validation"));
      updateValidationMessage(state.transit_number, getElement("transit_number_validation"));
      updateValidationMessage(state.institution_number, getElement("institution_number_validation"));
      updateValidationMessage(state.account_type, getElement("account_type_validation"));
      updateValidationMessage(state["address.line1"], getElement("address_line1_validation"));
      updateValidationMessage(state["address.line2"], getElement("address_line2_validation"));
      updateValidationMessage(state["address.city"], getElement("address_city_validation"));
      updateValidationMessage(state["address.postal_code"], getElement("address_postal_code_validation"));
      updateValidationMessage(state["address.region"], getElement("address_state_validation") || getElement("address_region_validation"));

      // Handle country-specific fields
      const selectedCountry = getNestedValue(state, ["address.country", "selected"], "USA");

      // Get country-specific excluded fields
      const countryExcludedFields = getNestedValue(COUNTRY_EXCLUDED_FIELDS, selectedCountry, []);

      // Check if form has errors
      const hasErrors = hasAnyError(excludeFields(state, countryExcludedFields), (field) => {
        const errorMessages = field.errorMessages === undefined ? [] : field.errorMessages;
        return errorMessages.length > 0;
      });

      // Update submit button state
      const submitButton = getElement("finix-submit-button");
      if (submitButton) {
        submitButton.disabled = hasErrors;
      }

      // Show/hide fields based on country
      if (state) {
        const isNotUSA = "USA" !== selectedCountry;
        const isCanada = "CAN" === selectedCountry;

        const bankCodeElement = getElement("bank_code");
        const transitNumberElement = getElement("transit_number");
        const institutionNumberElement = getElement("institution_number");

        if (isNotUSA && isCanada) {
          setElementStyle(bankCodeElement, "display", "none");
          setElementStyle(transitNumberElement, "display", "block");
          setElementStyle(institutionNumberElement, "display", "block");
        } else {
          setElementStyle(bankCodeElement, "display", "block");
          setElementStyle(transitNumberElement, "display", "none");
          setElementStyle(institutionNumberElement, "display", "none");
        }
      }
    }

    // Call user's update handler if provided
    if (typeof onUpdate === "function") {
      onUpdate(state, binInfo, hasErrors);
    }
  };
}

// Setup the toggle UI for TokenForm
function setupToggleUI({ finix, elementId, options = {}, callback = () => {} }) {
  const buttonContainer = document.createElement("div");
  buttonContainer.setAttribute("id", BUTTON_CONTAINER_ID);
  buttonContainer.setAttribute("class", BUTTON_CONTAINER_ID);

  // Create card button
  const cardButton = document.createElement("div");
  cardButton.setAttribute("id", "finix-card-button");
  cardButton.setAttribute("class", "finix-card-button finix-button active");
  cardButton.innerHTML = `<img src="${CARD_ICON_URL}" width="16"/><span>Card</span>`;
  cardButton.addEventListener("click", () => {
    getElement(elementId, ".finix-button.active").classList.remove("active");
    getElement(elementId, ".finix-card-button").classList.add("active");
    showLoading(elementId);
    callback(finix.CardTokenForm(elementId, options));
  });
  buttonContainer.appendChild(cardButton);

  // Create bank button
  const bankButton = document.createElement("div");
  bankButton.setAttribute("id", "finix-bank-button");
  bankButton.setAttribute("class", "finix-button finix-bank-button");
  bankButton.innerHTML = `<img src="${BANK_ICON_URL}" width="16"/><span>Bank Account</span>`;
  bankButton.addEventListener("click", () => {
    getElement(elementId, ".finix-button.active").classList.remove("active");
    getElement(elementId, ".finix-bank-button").classList.add("active");
    showLoading(elementId);
    callback(finix.BankTokenForm(elementId, options));
  });
  buttonContainer.appendChild(bankButton);

  // Add to the DOM
  document.getElementById(elementId) && document.getElementById(elementId).appendChild(buttonContainer);
}
