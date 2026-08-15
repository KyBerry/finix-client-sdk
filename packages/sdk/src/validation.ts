import { FinixSdkError } from "./errors";
import { isRecord } from "./internal/native";
import {
  FINIX_AUTH_ENVIRONMENTS,
  FINIX_ENVIRONMENTS,
  FINIX_FIELD_IDS,
  FINIX_REQUIRED_FIELD_IDS,
  FINIX_THEMES,
  type FinixAuthConfig,
  type FinixClientConfig,
  type FinixFieldId,
  type FinixHostedAppearance,
  type FinixPaymentFormOptions,
} from "./types";

const HOSTED_APPEARANCE_KEYS = new Set([
  "showLabels",
  "showPlaceholders",
  "labels",
  "placeholders",
  "errorMessages",
  "hidePotentialIssueMessages",
  "hideErrorMessages",
  "submitLabel",
  "theme",
  "enableDarkMode",
  "styles",
  "fonts",
]);

const OPTION_KEYS = new Set([
  "paymentMethods",
  "showAddress",
  "showLabels",
  "showPlaceholders",
  "hideFields",
  "requiredFields",
  "labels",
  "placeholders",
  "errorMessages",
  "defaultValues",
  "submitLabel",
  "requireSecurityCode",
  "confirmAccountNumber",
  "hidePotentialIssueMessages",
  "hideErrorMessages",
  "theme",
  "enableDarkMode",
  "plaidLinkSettings",
  "styles",
  "fonts",
  "onLoad",
  "onUpdate",
  "onChange",
  "onSubmit",
  "onSubmitResult",
  "onError",
]);
const FIELD_IDS = new Set<string>(FINIX_FIELD_IDS);
const REQUIRED_FIELD_IDS = new Set<string>(FINIX_REQUIRED_FIELD_IDS);
const SENSITIVE_DEFAULT_FIELDS = new Set([
  "number",
  "expiration_date",
  "security_code",
  "account_number",
  "bank_code",
  "account_type",
  "institution_number",
  "transit_number",
]);

function invalid(message: string, details?: unknown): never {
  throw new FinixSdkError("invalid_configuration", message, { details });
}

function assertNonEmptyString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    invalid(`${label} must be a non-empty string.`);
  }
}

function validateScriptOptions(value: unknown): void {
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    invalid("script must be an object.");
  }
  for (const key of Object.keys(value)) {
    if (key !== "nonce" && key !== "timeoutMs") {
      invalid(`Unknown script option: ${key}.`);
    }
  }
  if (value.nonce !== undefined) {
    assertNonEmptyString(value.nonce, "script.nonce");
  }
  if (value.timeoutMs !== undefined && (typeof value.timeoutMs !== "number" || !Number.isFinite(value.timeoutMs) || value.timeoutMs <= 0)) {
    invalid("script.timeoutMs must be a positive finite number.");
  }
}

function validateOptionalTimeout(value: unknown, label: string): void {
  if (value !== undefined && (typeof value !== "number" || !Number.isFinite(value) || value <= 0)) {
    invalid(`${label} must be a positive finite number.`);
  }
}

export function validateClientConfig(config: FinixClientConfig): void {
  if (typeof config !== "object" || config === null || Array.isArray(config)) {
    invalid("FinixClient configuration must be an object.");
  }
  if (!FINIX_ENVIRONMENTS.some((environment) => environment === config.environment)) {
    invalid('environment must be either "sandbox" or "prod".');
  }
  assertNonEmptyString(config.applicationId, "applicationId");
  validateScriptOptions(config.script);
  validateOptionalTimeout(config.formReadyTimeoutMs, "formReadyTimeoutMs");
  validateOptionalTimeout(config.submissionTimeoutMs, "submissionTimeoutMs");
}

export function validateAuthConfig(config: FinixAuthConfig): void {
  if (typeof config !== "object" || config === null || Array.isArray(config)) {
    invalid("Finix Auth configuration must be an object.");
  }
  if (!FINIX_AUTH_ENVIRONMENTS.some((environment) => environment === config.environment)) {
    invalid('Auth environment must be either "sandbox" or "live".');
  }
  assertNonEmptyString(config.merchantId, "merchantId");
  validateScriptOptions(config.script);
  validateOptionalTimeout(config.readyTimeoutMs, "readyTimeoutMs");
}

function validateBoolean(value: unknown, label: string): void {
  if (value !== undefined && typeof value !== "boolean") {
    invalid(`${label} must be a boolean.`);
  }
}

function validateStringRecord(value: unknown, label: string, allowedKeys: ReadonlySet<string>, forbiddenKeys: ReadonlySet<string> = new Set()): void {
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    invalid(`${label} must be an object.`);
  }
  for (const [key, fieldValue] of Object.entries(value)) {
    if (!allowedKeys.has(key)) {
      invalid(`${label} contains an unsupported field ID: ${key}.`);
    }
    if (forbiddenKeys.has(key)) {
      invalid(`${label} cannot contain sensitive field: ${key}.`);
    }
    if (typeof fieldValue !== "string") {
      invalid(`${label}.${key} must be a string.`);
    }
  }
}

function validateFieldArray(value: unknown, label: string, allowedKeys: ReadonlySet<string>): void {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    invalid(`${label} must be an array.`);
  }
  const seen = new Set<string>();
  for (const field of value) {
    if (typeof field !== "string" || !allowedKeys.has(field)) {
      invalid(`${label} contains an unsupported field ID: ${String(field)}.`);
    }
    if (seen.has(field)) {
      invalid(`${label} cannot contain duplicate field IDs.`);
    }
    seen.add(field);
  }
}

function validatePaymentMethods(value: unknown): void {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    invalid("paymentMethods must be an array.");
  }
  const signature = value.join(",");
  if (signature !== "card" && signature !== "bank" && signature !== "card,bank") {
    invalid('paymentMethods must be ["card"], ["bank"], or ["card", "bank"].');
  }
}

function validateStyles(value: unknown): void {
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    invalid("styles must be an object.");
  }
  const targetStates: Record<string, ReadonlySet<string>> = {
    form: new Set(["default", "error", "success", "focused"]),
    input: new Set(["default", "error", "success", "focused"]),
    sectionHeader: new Set(["default", "focused"]),
    section: new Set(["default"]),
    submitButton: new Set(["default", "disabled"]),
  };
  for (const [mode, theme] of Object.entries(value)) {
    if ((mode !== "default" && mode !== "dark") || !isRecord(theme)) {
      invalid(`styles contains an unsupported mode: ${mode}.`);
    }
    for (const [target, states] of Object.entries(theme)) {
      const allowedStates = targetStates[target];
      if (!allowedStates || !isRecord(states)) {
        invalid(`styles.${mode} contains an unsupported target: ${target}.`);
      }
      for (const [state, properties] of Object.entries(states)) {
        if (!allowedStates.has(state) || !isRecord(properties)) {
          invalid(`styles.${mode}.${target} contains an unsupported state: ${state}.`);
        }
        for (const [property, propertyValue] of Object.entries(properties)) {
          const isFiniteNumber = typeof propertyValue === "number" && Number.isFinite(propertyValue);
          if (typeof propertyValue !== "string" && !isFiniteNumber) {
            invalid(`styles.${mode}.${target}.${state}.${property} must be a string or finite number.`);
          }
        }
      }
    }
  }
}

function validateFonts(value: unknown): void {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    invalid("fonts must be an array.");
  }
  for (const [index, font] of value.entries()) {
    if (!isRecord(font)) {
      invalid(`fonts[${index}] must be an object.`);
    }
    assertNonEmptyString(font.fontFamily, `fonts[${index}].fontFamily`);
    assertNonEmptyString(font.url, `fonts[${index}].url`);
    assertNonEmptyString(font.format, `fonts[${index}].format`);
    try {
      if (new URL(font.url).protocol !== "https:") {
        invalid(`fonts[${index}].url must use HTTPS.`);
      }
    } catch (error: unknown) {
      if (error instanceof FinixSdkError) {
        throw error;
      }
      invalid(`fonts[${index}].url must be a valid HTTPS URL.`);
    }
  }
}

function validatePlaidSettings(value: unknown): void {
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    invalid("plaidLinkSettings must be an object.");
  }
  for (const key of Object.keys(value)) {
    if (key !== "displayName" && key !== "language" && key !== "countries") {
      invalid(`Unknown plaidLinkSettings option: ${key}.`);
    }
  }
  if (value.displayName !== undefined) {
    assertNonEmptyString(value.displayName, "plaidLinkSettings.displayName");
  }
  if (value.language !== undefined) {
    assertNonEmptyString(value.language, "plaidLinkSettings.language");
  }
  if (value.countries !== undefined) {
    if (!Array.isArray(value.countries) || value.countries.some((country) => typeof country !== "string" || country.length === 0)) {
      invalid("plaidLinkSettings.countries must be an array of non-empty strings.");
    }
  }
}

function validateHostedAppearanceFields(appearance: FinixHostedAppearance): void {
  for (const key of [
    "showLabels",
    "showPlaceholders",
    "hidePotentialIssueMessages",
    "hideErrorMessages",
    "enableDarkMode",
  ] as const) {
    validateBoolean(appearance[key], key);
  }
  validateStringRecord(appearance.labels, "labels", FIELD_IDS);
  validateStringRecord(appearance.placeholders, "placeholders", FIELD_IDS);
  validateStringRecord(appearance.errorMessages, "errorMessages", FIELD_IDS);
  if (appearance.submitLabel !== undefined) {
    assertNonEmptyString(appearance.submitLabel, "submitLabel");
  }
  if (appearance.theme !== undefined && !FINIX_THEMES.some((theme) => theme === appearance.theme)) {
    invalid(`Unsupported theme: ${String(appearance.theme)}.`);
  }
  validateStyles(appearance.styles);
  validateFonts(appearance.fonts);
}

export function validateHostedAppearance(appearance: FinixHostedAppearance): void {
  if (!isRecord(appearance)) {
    invalid("Hosted appearance must be an object.");
  }
  for (const key of Object.keys(appearance)) {
    if (!HOSTED_APPEARANCE_KEYS.has(key)) {
      invalid(`Unknown hosted appearance option: ${key}.`);
    }
  }
  validateHostedAppearanceFields(appearance);
}

export function validatePaymentFormOptions(options: FinixPaymentFormOptions): void {
  if (typeof options !== "object" || options === null || Array.isArray(options)) {
    invalid("Payment form options must be an object.");
  }
  for (const key of Object.keys(options)) {
    if (!OPTION_KEYS.has(key)) {
      invalid(`Unknown payment form option: ${key}.`);
    }
  }

  validatePaymentMethods(options.paymentMethods);
  for (const key of ["showAddress", "requireSecurityCode", "confirmAccountNumber"] as const) {
    validateBoolean(options[key], key);
  }
  validateFieldArray(options.hideFields, "hideFields", FIELD_IDS);
  const hideFields: unknown = options.hideFields;
  if (Array.isArray(hideFields) && hideFields.some((field: unknown) => field === "number" || field === "expiration_date")) {
    invalid("hideFields cannot contain number or expiration_date.");
  }
  validateFieldArray(options.requiredFields, "requiredFields", REQUIRED_FIELD_IDS);
  validateStringRecord(options.defaultValues, "defaultValues", FIELD_IDS, SENSITIVE_DEFAULT_FIELDS);
  validateHostedAppearanceFields(options);
  validatePlaidSettings(options.plaidLinkSettings);
  for (const callback of ["onLoad", "onUpdate", "onChange", "onSubmit", "onSubmitResult", "onError"] as const) {
    if (options[callback] !== undefined && typeof options[callback] !== "function") {
      invalid(`${callback} must be a function.`);
    }
  }
}

export function resolveMountElement(element: string | HTMLElement): HTMLElement {
  if (typeof element === "string") {
    assertNonEmptyString(element, "element ID");
    const resolved = document.getElementById(element);
    if (!resolved) {
      invalid(`No element exists with ID "${element}".`);
    }
    return resolved;
  }
  if (!(element instanceof HTMLElement)) {
    invalid("element must be an HTMLElement or an element ID.");
  }
  return element;
}

export function assertMerchantId(merchantId: string): void {
  assertNonEmptyString(merchantId, "merchantId");
}

export function isPublicFieldId(value: string): value is FinixFieldId {
  return FIELD_IDS.has(value);
}
