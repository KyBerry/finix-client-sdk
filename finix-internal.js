/**
 * Finix Payment SDK - Deobfuscated Core Functionality
 *
 * This is a cleaned up and deobfuscated version of the core Finix SDK functionality
 * that runs inside their secure iframe for payment processing.
 */

// Core API endpoints for different environments
const API_ENDPOINTS = {
  prod: "https://internal.live-payments-api.com",
  production: "https://internal.live-payments-api.com",
  live: "https://internal.live-payments-api.com",
  sandbox: "https://internal.sandbox-payments-api.com",
  qa: "https://internal.qa-payments-api.com",
};

/**
 * Gets the appropriate API URL for token creation
 * @param {string} environment - The environment to use (prod, sandbox, etc)
 * @param {string} applicationId - The Finix application ID
 * @returns {string} The complete API URL
 */
function getTokenizationUrl(environment, applicationId) {
  const baseEnv = typeof environment === "string" ? environment.toLowerCase() : "sandbox";
  const baseUrl = API_ENDPOINTS[baseEnv] || API_ENDPOINTS.sandbox;
  return `${baseUrl}/applications/${applicationId}/tokens`;
}

/**
 * Safely validates and encodes a URL
 * @param {string} url - The URL to validate and encode
 * @returns {string} The encoded URL if valid, empty string otherwise
 */
function safeEncodeUrl(url) {
  try {
    if (new URL(url)) {
      // Check for unsafe characters
      if (!/^[a-zA-Z0-9\-._~:\/?#[\]@!$&'()*+,;=%]+$/.test(url)) {
        throw new Error("URL contains unsafe characters");
      }
      return encodeURI(url);
    }
  } catch (e) {
    return "";
  }
}

/**
 * Checks if a URL is valid
 * @param {string} url - The URL to validate
 * @returns {boolean} Whether the URL is valid
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Adds custom fonts to the iframe if provided
 * @param {Array} fonts - Array of font objects with url, format, and fontFamily properties
 */
function loadCustomFonts(fonts) {
  if (!fonts || !Array.isArray(fonts) || fonts.length === 0) {
    return;
  }

  const stylesElement = document.getElementById("styles");
  if (!stylesElement || stylesElement.hasAttribute("data-fonts-added")) {
    return;
  }

  const validFormats = ["woff", "woff2", "truetype", "opentype", "embedded-opentype", "svg"];

  for (const font of fonts) {
    if (!font) continue;

    const { url, format, fontFamily } = font;
    if (!fontFamily || !url || !format) continue;

    const urlMatch = /^https:\/\/[^\s'"]+$/.exec(url);
    if (!urlMatch || !urlMatch[0]) continue;

    if (!format || !validFormats.includes(format)) {
      console.warn(`Invalid font format ${format} for font ${fontFamily} at ${url}`);
      continue;
    }

    const encodedUrl = safeEncodeUrl(urlMatch[0]);
    const isHttps = encodedUrl && encodedUrl.toLowerCase().startsWith("https://");

    if (isValidUrl(encodedUrl) && isHttps) {
      const sanitizedFontFamily = fontFamily.replace(/[^\w\s,-]/g, "");
      const fontSrc = format ? `url("${encodedUrl}") format("${format}")` : `url("${encodedUrl}")`;

      const fontFaceRule = `@font-face { font-family: "${sanitizedFontFamily}"; src: ${fontSrc}; }`;
      stylesElement.appendChild(document.createTextNode(fontFaceRule));
    } else {
      console.warn(`Font url ${url} is not valid or is not served over HTTPS`);
    }
  }

  stylesElement.setAttribute("data-fonts-added", "true");
}

/**
 * Posts a message to the parent window
 * @param {string} messageName - The name of the message
 * @param {Object} messageData - The data to send with the message
 * @param {Object} options - Additional options
 */
function postMessageToParent(messageName, messageData, options = {}) {
  window.parent.postMessage(Object.assign({ messageName, messageData }, options), "*");
}

/**
 * Responds to a specific request with a response
 * @param {string} messageName - The name of the response message
 * @param {string} messageId - The ID of the original message
 * @param {Object} response - The response object
 */
function respondToMessage(messageName, messageId, response) {
  postMessageToParent(messageName, { status: response.status, data: response.data }, { messageId });
}

/**
 * Gets all same-domain frames in the parent window
 * @returns {Array} Array of frame objects
 */
function getAllFrames() {
  const frames = [];
  const parentFrames = window.parent.frames;

  for (let i = 0; i < parentFrames.length; i++) {
    try {
      if (parentFrames[i].location.domain === window.location.domain) {
        frames.push(parentFrames[i]);
      }
    } catch (e) {
      // Skip cross-origin frames
    }
  }

  return frames;
}

// Validation rules for different field types
const ValidationRules = {
  required: function (value, errorMessage = "Value is required") {
    if (!value) return [errorMessage];
  },

  cardExpiry: function (value, errorMessage = "Invalid expiration date") {
    if (!Payment.fns.validateCardExpiry(value)) return [errorMessage];
  },

  cardNumber: function (value, errorMessage = "Invalid card number") {
    if (!Payment.fns.validateCardNumber(value)) return [errorMessage];
  },

  cardCVC: function (value, errorMessage = "Invalid CVV") {
    if (!Payment.fns.validateCardCVC(value)) return [errorMessage];
  },

  transitNumber: function (value, errorMessage = "Invalid transit number") {
    if (!/^\d{5}$/.test(value)) return [errorMessage];
  },

  institutionNumber: function (value, errorMessage = "Invalid institution number") {
    if (!/^\d{3}$/.test(value)) return [errorMessage];
  },
};

/**
 * Default field validations - maps field types to appropriate validations
 */
const DEFAULT_VALIDATIONS = {
  number: ["cardNumber"],
  expiration_date: ["cardExpiry"],
  security_code: ["cardCVC"],
};

/**
 * Gets all validation rules for a field type
 * @param {string} fieldType - The type of field
 * @param {Array|string} validations - Additional validations to include
 * @returns {Array} All validation rules for the field
 */
function getFieldValidations(fieldType, validations) {
  validations = validations || [];
  if (typeof validations === "string") {
    validations = [validations];
  }

  return validations.concat(DEFAULT_VALIDATIONS[fieldType] || []).reduce((unique, rule) => {
    if (unique.indexOf(rule) < 0) {
      unique.push(rule);
    }
    return unique;
  }, []);
}

/**
 * Validates a field value using the specified validation rules
 * @param {Array} validations - Array of validation rule names
 * @param {string} value - The value to validate
 * @param {string} errorMessage - Custom error message
 * @returns {Array} Array of error messages, empty if valid
 */
function validateField(validations, value, errorMessage) {
  return validations.reduce((errors, rule) => {
    const ruleErrors = ValidationRules[rule](value, errorMessage);
    return ruleErrors ? errors.concat(ruleErrors) : errors;
  }, []);
}

// Field formatters for different field types
const FieldFormatters = {
  number: function (element) {
    Payment.formatCardNumber(element);
  },
  expiration_date: function (element) {
    Payment.formatCardExpiry(element);
  },
  security_code: function (element) {
    Payment.formatCardCVC(element);
  },
};

/**
 * Applies formatting to a field
 * @param {string} fieldType - The type of field
 * @param {Element} element - The DOM element to format
 */
function formatField(fieldType, element) {
  if (FieldFormatters[fieldType]) {
    FieldFormatters[fieldType](element);
  }
}

// Field processors for special handling of certain field types
const FieldProcessors = {
  expiration_date: function (tokenData, fieldValue) {
    const expiryValue = Payment.fns.cardExpiryVal(fieldValue);
    tokenData.expiration_month = expiryValue.month;
    tokenData.expiration_year = expiryValue.year;
  },
};

/**
 * Processes field values for tokenization
 * @param {string} fieldName - The name of the field
 * @param {Object} tokenData - The data object to update
 * @param {string} fieldValue - The field value
 */
function processFieldForTokenization(fieldName, tokenData, fieldValue) {
  if (FieldProcessors[fieldName]) {
    FieldProcessors[fieldName](tokenData, fieldValue);
  } else {
    // Handle nested objects with dot notation (e.g., "address.city")
    setNestedValue(tokenData, fieldName.split("."), fieldValue);
  }
}

/**
 * Sets a nested value in an object using an array of keys
 * @param {Object} obj - The object to update
 * @param {Array} keys - Array of keys representing the path
 * @param {*} value - The value to set
 */
function setNestedValue(obj, keys, value) {
  const key = keys.shift();

  if (keys.length > 0) {
    obj[key] = obj[key] || {};
    setNestedValue(obj[key], keys, value);
  } else {
    obj[key] = value;
  }
}

/**
 * Gets a value from an object using dot notation
 * @param {Object} obj - The object to get from
 * @param {string|Array} path - The path to the value, either as a string or array
 * @param {*} defaultValue - The default value if not found
 * @returns {*} The value or the default
 */
function getNestedValue(obj, path, defaultValue) {
  const keys = Array.isArray(path) ? path : path.split(".");
  const result = keys.reduce((nestedObj, key) => {
    return nestedObj && nestedObj[key] !== undefined ? nestedObj[key] : undefined;
  }, obj);

  return result === undefined ? defaultValue : result;
}

/**
 * Card brand icons/logos component mapping
 */
const CardBrandIcons = {
  amex: AmexCardIcon,
  discover: DiscoverCardIcon,
  jcb: JCBCardIcon,
  mastercard: MastercardIcon,
  visa: VisaCardIcon,
};

/**
 * React component for input fields
 */
class InputField extends React.Component {
  constructor(props) {
    super(props);

    this.onUpdate = this.onUpdate.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onFocus = this.onFocus.bind(this);

    this.state = {
      isFocused: false,
      isDirty: false,
      errorMessages: [],
      cardBrand: null,
    };
  }

  publishState(additionalState) {
    const { formId, validations, errorMessage } = this.props;
    const errors = validateField(validations, this.element.value, errorMessage);

    const newState = Object.assign({ errorMessages: errors }, additionalState);

    this.setState(newState, () => {
      postMessageToParent(
        "field-updated",
        {
          name: this.props.type,
          state: {
            isFocused: this.state.isFocused,
            isDirty: this.state.isDirty,
            errorMessages: this.state.errorMessages,
          },
        },
        { formId },
      );
    });
  }

  onFocus() {
    this.publishState({ isFocused: true });
  }

  onBlur() {
    this.publishState({ isFocused: false });
  }

  onUpdate(event) {
    const { type, formId } = this.props;

    // Special handling for card number fields
    if (type === "number") {
      const value = getNestedValue(event, "target.value", "");
      const cardBrand = Payment.fns.cardType(value);

      this.setState({ cardBrand });

      // Send card BIN information to parent
      postMessageToParent(
        "bin-information-received",
        {
          cardBrand,
          bin: value.replace(/[^\d]/g, "").slice(0, 6),
        },
        { formId },
      );
    }

    this.publishState({ isDirty: true });
  }

  componentDidMount() {
    const { type, formId, paymentInstrumentType, fonts } = this.props;

    // Load custom fonts if provided
    loadCustomFonts(fonts);

    // Apply field formatting
    formatField(type, this.element);

    // Publish initial state
    this.publishState({});

    // Set up form submission handler
    window.addEventListener("message", (event) => {
      if (!event.data || event.data.messageName !== "submit") return;

      const { messageId, messageData } = event.data;
      const { data, applicationId, environment } = messageData;

      // Collect data from all fields in the form
      const formData = {};
      getAllFrames().forEach((frame) => {
        const input = frame.document.querySelector("input") || frame.document.querySelector("select");

        if (input && input.getAttribute("data-form-id") === formId && (input.offsetParent || input.name === "address.country")) {
          processFieldForTokenization(input.name, formData, input.value);
        }
      });

      // Get the country and set the currency
      const country = getNestedValue(formData, "address.country", "USA");
      const CURRENCY_BY_COUNTRY = {
        USA: "USD",
        CAN: "CAD",
      };

      // Build the token request payload
      const tokenData = {
        type: paymentInstrumentType,
        country,
        currency: getNestedValue(CURRENCY_BY_COUNTRY, country, "USD"),
        ...formData,
        ...data,
      };

      // Send the request to Finix API
      axios
        .post(getTokenizationUrl(environment, applicationId), tokenData)
        .then((response) => {
          respondToMessage("response-received", messageId, response);
        })
        .catch((error) => {
          respondToMessage("response-error", messageId, getNestedValue(error, "response"));
        });
    });
  }

  getPlaceholder() {
    const { placeholder } = this.props;

    if (this.state.isFocused && getNestedValue(placeholder, "hideOnFocus", false)) {
      return "";
    }

    return getNestedValue(placeholder, "text", "");
  }

  getStyle() {
    const styles = getNestedValue(this.props, "styles", {});
    const { error, success, dirty, focused } = styles;
    let currentStyle = getNestedValue(styles, "default", {});

    if (this.state.isDirty) {
      currentStyle = Object.assign({}, currentStyle, dirty);

      if (this.state.errorMessages.length > 0 && !this.state.isFocused) {
        currentStyle = Object.assign({}, currentStyle, error);
      } else {
        currentStyle = Object.assign({}, currentStyle, success);
      }
    }

    if (this.state.isFocused) {
      currentStyle = Object.assign({}, currentStyle, focused);
    }

    return currentStyle;
  }

  getAutoComplete() {
    return this.props.autoComplete || "off";
  }

  render() {
    const { type, formId, inputType, defaultValue } = this.props;
    const autoComplete = this.getAutoComplete();
    const placeholder = this.getPlaceholder();
    const style = this.getStyle();
    const { cardBrand } = this.state;

    const CardBrandComponent = type === "number" && cardBrand ? CardBrandIcons[cardBrand] : null;

    return React.createElement(
      "div",
      { className: "input-wrapper" },
      React.createElement("input", {
        "data-form-id": formId,
        placeholder,
        ref: (element) => (this.element = element),
        name: type,
        type: inputType,
        onBlur: this.onBlur,
        onFocus: this.onFocus,
        onKeyUp: this.onUpdate,
        onKeyDown: this.onUpdate,
        onChange: this.onUpdate,
        onInput: this.onUpdate,
        autoComplete,
        defaultValue,
        style,
      }),
      CardBrandComponent ? React.createElement(CardBrandComponent, null) : null,
    );
  }
}

// Default props for InputField
InputField.defaultProps = {
  inputType: "text",
};

/**
 * React component for select fields
 */
class SelectField extends React.Component {
  constructor(props) {
    super(props);

    this.onUpdate = this.onUpdate.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onFocus = this.onFocus.bind(this);

    this.state = {
      isFocused: false,
      isDirty: false,
      errorMessages: [],
      selected: this.props.defaultOption,
      country: this.props.type === "address.country" ? this.props.defaultOption : undefined,
    };
  }

  publishState(additionalState) {
    const value = this.element.value;
    const errors = validateField(this.props.validations, value);

    const newState = Object.assign({ errorMessages: errors }, additionalState);

    this.setState(newState, () => {
      postMessageToParent(
        "field-updated",
        {
          name: this.props.type,
          state: this.state,
        },
        { formId: this.props.formId },
      );
    });
  }

  onFocus() {
    this.publishState({ isFocused: true });
  }

  onBlur() {
    this.publishState({ isFocused: false });
  }

  onUpdate(event) {
    // Special handling for card number fields
    if (this.props.type === "number") {
      const value = event.target.value;

      postMessageToParent(
        "bin-information-received",
        {
          cardBrand: Payment.fns.cardType(value),
          bin: value.replace(/[^\d]/g, "").slice(0, 6),
        },
        { formId: this.props.formId },
      );
    }

    this.publishState({
      isDirty: true,
      selected: event.target.value,
      country: this.props.type === "address.country" ? event.target.value : undefined,
    });
  }

  componentDidMount() {
    const { formId, type, paymentInstrumentType, fonts } = this.props;

    // Load custom fonts if provided
    loadCustomFonts(fonts);

    // Apply field formatting
    formatField(type, this.element);

    // Publish initial state
    this.publishState({});

    // Set up form submission handler
    window.addEventListener("message", (event) => {
      if (!event.data || event.data.messageName !== "submit") return;

      const { messageId, messageData } = event.data;
      const { data, applicationId, environment } = messageData;

      // Collect form data from all fields
      const formData = {};
      getAllFrames().forEach((frame) => {
        const input = frame.document.querySelector("input") || frame.document.querySelector("select");

        if (input.getAttribute("data-form-id") === formId) {
          processFieldForTokenization(input.name, formData, input.value);
        }
      });

      // Build the token request payload
      const tokenData = {
        type: paymentInstrumentType,
        ...formData,
        ...data,
      };

      // Send the request to Finix API
      axios
        .post(getTokenizationUrl(environment, applicationId), tokenData)
        .then((response) => {
          respondToMessage("response-received", messageId, response);
        })
        .catch((error) => {
          respondToMessage("response-error", messageId, error.response);
        });
    });
  }

  getPlaceholder() {
    if (this.state.isFocused && this.props.placeholder.hideOnFocus) {
      return "";
    }

    return this.props.placeholder.text;
  }

  getStyle() {
    const styles = getNestedValue(this.props, "styles", {});
    const { dirty, error, success, focused } = styles;
    let currentStyle = getNestedValue(styles, "default", {});

    if (this.state.isDirty) {
      currentStyle = Object.assign({}, currentStyle, dirty);

      if (this.state.errorMessages.length > 0) {
        currentStyle = Object.assign({}, currentStyle, error);
      } else {
        currentStyle = Object.assign({}, currentStyle, success);
      }
    }

    if (this.state.isFocused) {
      currentStyle = Object.assign({}, currentStyle, focused);
    }

    return currentStyle;
  }

  getAutoComplete() {
    return this.props.autoComplete || "off";
  }

  render() {
    const autoComplete = this.getAutoComplete();
    const placeholder = this.getPlaceholder();
    const style = this.getStyle();
    const { inputType, options } = this.props;

    const optionsWithDefault = [{ label: "Please select...", value: "" }, ...options];

    const defaultOptionValue = this.props.defaultOption || optionsWithDefault[0].value;

    return React.createElement(
      "select",
      {
        "data-form-id": this.props.formId,
        placeholder,
        ref: (element) => (this.element = element),
        name: this.props.type,
        type: inputType,
        onBlur: this.onBlur,
        onFocus: this.onFocus,
        onKeyUp: this.onUpdate,
        onKeyDown: this.onUpdate,
        onChange: this.onUpdate,
        onInput: this.onUpdate,
        autoComplete,
        style,
        defaultValue: defaultOptionValue,
      },
      optionsWithDefault.map((option, index) => {
        return React.createElement(
          "option",
          {
            key: index,
            value: option.value,
            disabled: index === 0,
          },
          option.label,
        );
      }),
    );
  }
}

// Default props for SelectField
SelectField.defaultProps = {
  inputType: "text",
};

/**
 * Normalizes a placeholder configuration
 * @param {string|Object} placeholder - The placeholder text or configuration
 * @returns {Object} Normalized placeholder config with text and hideOnFocus properties
 */
function normalizePlaceholder(placeholder) {
  if (placeholder == null) {
    return { text: "", hideOnFocus: false };
  }

  if (typeof placeholder === "string") {
    return { text: placeholder, hideOnFocus: false };
  }

  return placeholder;
}

/**
 * Main form component
 * @param {Object} props - Component props
 * @returns {React.Element} The form component
 */
function FinixForm(props) {
  const { type, formId, placeholder, validations, options } = props;

  let optionsList;

  // Handle special option lists
  if (options === "country") {
    optionsList = COUNTRY_OPTIONS;
  } else if (options === "state") {
    optionsList = STATE_OPTIONS;
  } else if (options === "account_type") {
    optionsList = ACCOUNT_TYPE_OPTIONS;
  }

  return React.createElement(
    "form",
    {
      onSubmit: (e) => {
        e.preventDefault();
        postMessageToParent("form-submit", {}, { formId });
      },
    },
    options
      ? React.createElement(
          SelectField,
          Object.assign({}, props, {
            placeholder: normalizePlaceholder(placeholder),
            validations: getFieldValidations(type, validations),
            options: optionsList || options,
          }),
        )
      : React.createElement(
          InputField,
          Object.assign({}, props, {
            placeholder: normalizePlaceholder(placeholder),
            validations: getFieldValidations(type, validations),
          }),
        ),
  );
}

// Initialize the form when the DOM is loaded
document.addEventListener(
  "DOMContentLoaded",
  function () {
    // Get configuration from base64-encoded query string
    const config = JSON.parse(atob(window.location.search.slice(1)));

    // Render the form
    ReactDOM.render(React.createElement(FinixForm, config), document.getElementById("react"));

    // Auto-focus on first field when iframe gets focus
    window.addEventListener("focus", function () {
      if (document.querySelector("input")) {
        document.querySelector("input").focus();
      }
      if (document.querySelector("select")) {
        document.querySelector("select").focus();
      }
    });
  },
  true,
);

// Constants and lookup tables

// US state options for select fields
const STATE_OPTIONS = Object.keys(US_STATES).map(function (code) {
  return { label: US_STATES[code], value: code };
});

// Country options for select fields
const COUNTRY_OPTIONS = Object.keys(COUNTRIES).map(function (code) {
  return { label: COUNTRIES[code], value: code };
});

// Account type options for select fields
const ACCOUNT_TYPE_OPTIONS = [
  { label: "Personal Checking", value: "PERSONAL_CHECKING" },
  { label: "Personal Savings", value: "PERSONAL_SAVINGS" },
  { label: "Business Checking", value: "BUSINESS_CHECKING" },
  { label: "Business Savings", value: "BUSINESS_SAVINGS" },
];

// Currency mapping by country
const CURRENCY_BY_COUNTRY = {
  USA: "USD",
  CAN: "CAD",
};
