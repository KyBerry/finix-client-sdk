import type { Properties as CssProperties } from "csstype";

export const FINIX_ENVIRONMENTS = ["sandbox", "prod"] as const;
export type FinixEnvironment = (typeof FINIX_ENVIRONMENTS)[number];

export const FINIX_AUTH_ENVIRONMENTS = ["sandbox", "live"] as const;
export type FinixAuthEnvironment = (typeof FINIX_AUTH_ENVIRONMENTS)[number];

export const FINIX_PAYMENT_METHODS = ["card", "bank"] as const;
export type FinixPaymentMethod = (typeof FINIX_PAYMENT_METHODS)[number];
export type FinixPaymentMethods = readonly ["card"] | readonly ["bank"] | readonly ["card", "bank"];

export const FINIX_THEMES = ["finix", "amethyst", "sapphire", "topaz", "ruby", "emerald", "midnight", "elevated"] as const;
export type FinixTheme = (typeof FINIX_THEMES)[number];

export const FINIX_CARD_FIELD_IDS = ["card_holder_name", "number", "expiration_date", "security_code"] as const;
export type FinixCardFieldId = (typeof FINIX_CARD_FIELD_IDS)[number];

/**
 * `institution_number` and `transit_number` are used by the hosted Canadian
 * bank form and are named by Finix's default-value restrictions, but are
 * currently missing from the public Field IDs table.
 */
export const FINIX_BANK_FIELD_IDS = ["account_holder_name", "account_number", "bank_code", "account_type", "institution_number", "transit_number"] as const;
export type FinixBankFieldId = (typeof FINIX_BANK_FIELD_IDS)[number];

export const FINIX_ADDRESS_FIELD_IDS = ["address_line1", "address_line2", "address_city", "address_region", "address_postal_code", "address_country"] as const;
export type FinixAddressFieldId = (typeof FINIX_ADDRESS_FIELD_IDS)[number];

export const FINIX_FIELD_IDS = [...FINIX_CARD_FIELD_IDS, ...FINIX_BANK_FIELD_IDS, ...FINIX_ADDRESS_FIELD_IDS] as const;
export type FinixFieldId = (typeof FINIX_FIELD_IDS)[number];

export const FINIX_REQUIRED_FIELD_IDS = ["name", "card_holder_name", "account_holder_name", ...FINIX_ADDRESS_FIELD_IDS] as const;
export type FinixRequiredFieldId = (typeof FINIX_REQUIRED_FIELD_IDS)[number];

export type FinixHideableFieldId = Exclude<FinixFieldId, "number" | "expiration_date">;
export type FinixDefaultableFieldId = Exclude<FinixFieldId, "number" | "expiration_date" | "security_code" | "account_number" | "bank_code" | "account_type" | "institution_number" | "transit_number">;

export type FinixCssProperties = CssProperties<string | number>;

export type FinixStyleStates<State extends string> = Partial<Record<State, FinixCssProperties>>;

export interface FinixThemeStyles {
  form?: FinixStyleStates<"default" | "error" | "success" | "focused">;
  input?: FinixStyleStates<"default" | "error" | "success" | "focused">;
  sectionHeader?: FinixStyleStates<"default" | "focused">;
  section?: FinixStyleStates<"default">;
  submitButton?: FinixStyleStates<"default" | "disabled">;
}

export interface FinixStyles {
  default?: FinixThemeStyles;
  dark?: FinixThemeStyles;
}

/**
 * Styles as accepted by the definition helpers: either the full
 * `{ default, dark }` shape or a bare `{ input, form, ... }` object, which is
 * treated as the default mode.
 */
export type FinixStylesInput = FinixStyles | FinixThemeStyles;

/** Which color scheme the app is showing; used to flatten `styles.dark`. */
export type FinixColorScheme = "light" | "dark";

/**
 * The documented presentation options Finix can apply inside its hosted
 * payment-form iframe. Application-owned layout and controls remain outside
 * the iframe and can be composed with the React headless primitives.
 */
export interface FinixHostedAppearance {
  showLabels?: boolean;
  showPlaceholders?: boolean;
  labels?: Partial<Record<FinixFieldId, string>>;
  placeholders?: Partial<Record<FinixFieldId, string>>;
  errorMessages?: Partial<Record<FinixFieldId, string>>;
  hidePotentialIssueMessages?: boolean;
  hideErrorMessages?: boolean;
  submitLabel?: string;
  theme?: FinixTheme;
  enableDarkMode?: boolean;
  styles?: FinixStyles;
  fonts?: readonly FinixFont[];
}

export interface FinixFont {
  fontFamily: string;
  url: string;
  /** Finix does not currently publish a stable enum for this value. */
  format: string;
}

export interface FinixPlaidLinkSettings {
  displayName?: string;
  language?: string;
  countries?: readonly string[];
}

export interface FinixFieldState {
  errors?: boolean;
  isDirty?: boolean;
  isFocused?: boolean;
  errorMessages?: readonly string[];
  selected?: string;
  value?: string;
  [key: string]: unknown;
}

export type FinixFormState = Readonly<Record<string, FinixFieldState | undefined>>;

export interface FinixBinInformation {
  bin?: string;
  cardBrand?: string;
  [key: string]: unknown;
}

export const FINIX_INSTRUMENT_TYPES = ["PAYMENT_CARD", "BANK_ACCOUNT", "THIRD_PARTY_TOKEN"] as const;
export type FinixInstrumentType = (typeof FINIX_INSTRUMENT_TYPES)[number];

export interface FinixTokenData {
  id: string;
  created_at?: string;
  updated_at?: string;
  currency?: string;
  expires_at?: string;
  fingerprint?: string;
  instrument_type?: FinixInstrumentType;
  [key: string]: unknown;
}

export interface FinixTokenResponse {
  data: FinixTokenData;
  status?: number;
  [key: string]: unknown;
}

/** A validated token response with the token id lifted to the top level. */
export interface FinixSubmitResponse extends FinixTokenResponse {
  /** Same value as `data.id`. Send this to your backend. */
  token: string;
}

/** Everything Finix reports as the user types, as one object. */
export interface FinixChangeEvent {
  state: FinixFormState;
  binInformation: FinixBinInformation;
  hasErrors: boolean;
}

/** The outcome of one tokenization attempt. Check `ok` first. */
export type FinixSubmitResult =
  | { ok: true; token: string; response: FinixSubmitResponse; error: null }
  | { ok: false; token: null; response: null; error: import("./errors").FinixSdkError };

export type FinixOnLoad = () => void;
export type FinixOnUpdate = (state: FinixFormState, binInformation: FinixBinInformation, hasErrors: boolean) => void;
export type FinixOnChange = (event: FinixChangeEvent) => void;
export type FinixOnSubmit = (...result: [error: import("./errors").FinixSdkError, response: null] | [error: null, response: FinixSubmitResponse]) => void;
export type FinixOnSubmitResult = (result: FinixSubmitResult) => void;
export type FinixOnError = (error: import("./errors").FinixSdkError) => void;

export interface FinixPaymentFormOptions extends FinixHostedAppearance {
  paymentMethods?: FinixPaymentMethods;
  showAddress?: boolean;
  hideFields?: readonly FinixHideableFieldId[];
  requiredFields?: readonly FinixRequiredFieldId[];
  defaultValues?: Partial<Record<FinixDefaultableFieldId, string>>;
  requireSecurityCode?: boolean;
  confirmAccountNumber?: boolean;
  plaidLinkSettings?: FinixPlaidLinkSettings;
  onLoad?: FinixOnLoad;
  /** Positional form, matching Finix.js: `(state, binInformation, hasErrors)`. */
  onUpdate?: FinixOnUpdate;
  /** Object form of onUpdate: `({ state, binInformation, hasErrors })`. */
  onChange?: FinixOnChange;
  /** Positional form, matching Finix.js: `(error, response)`; exactly one is non-null. Providing it asks Finix to render its own submit button. */
  onSubmit?: FinixOnSubmit;
  /** Object form of onSubmit: `({ ok, token, response, error })`. Also asks Finix to render its own submit button. */
  onSubmitResult?: FinixOnSubmitResult;
  /** Wrapper-level runtime and lifecycle errors. This is not forwarded to Finix.js. */
  onError?: FinixOnError;
}

export interface FinixAsyncOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface LoadFinixOptions extends FinixAsyncOptions {
  /** CSP nonce to copy to the official Finix script element. */
  nonce?: string;
}

export interface FinixClientConfig {
  environment: FinixEnvironment;
  applicationId: string;
  script?: Omit<LoadFinixOptions, "signal">;
  formReadyTimeoutMs?: number;
  submissionTimeoutMs?: number;
}

export interface FinixAuthConfig {
  environment: FinixAuthEnvironment;
  merchantId: string;
  script?: Omit<LoadFinixOptions, "signal">;
  readyTimeoutMs?: number;
}
