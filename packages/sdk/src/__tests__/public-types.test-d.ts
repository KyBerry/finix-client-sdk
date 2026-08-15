import {
  defineFinixHostedAppearance,
  defineFinixHostedAppearanceAdapter,
  defineFinixStyles,
  FinixSdkError,
  mergeFinixStyles,
} from "../index";
import { FinixForm, type UseFinixPaymentFormResult } from "../react";
import type {
  FinixAuthConfig,
  FinixClientConfig,
  FinixHostedAppearance,
  FinixOnSubmit,
  FinixPaymentFormOptions,
  FinixPaymentMethods,
} from "../index";

const methods: FinixPaymentMethods = ["card", "bank"];
const clientConfig: FinixClientConfig = {
  environment: "prod",
  applicationId: "AP_production",
  script: { nonce: "csp-nonce", timeoutMs: 10_000 },
};
const authConfig: FinixAuthConfig = {
  environment: "live",
  merchantId: "MU_production",
};
const options: FinixPaymentFormOptions = {
  paymentMethods: methods,
  showAddress: true,
  requiredFields: ["name", "address_country"],
  hideFields: ["security_code"],
  defaultValues: {
    card_holder_name: "Buyer Name",
    address_country: "USA",
  },
  styles: {
    default: {
      form: { focused: { outlineColor: "blue" } },
      input: { error: { borderColor: "red" } },
    },
  },
};
const brandedStyles = defineFinixStyles({
  default: {
    input: { focused: { borderColor: "blue" } },
  },
} as const);
const focusedBorder: "blue" = brandedStyles.default.input.focused.borderColor;
const appearance = defineFinixHostedAppearance({
  theme: "elevated",
  hidePotentialIssueMessages: true,
  hideErrorMessages: false,
  styles: brandedStyles,
} as const);
const hostedAppearance: FinixHostedAppearance = appearance;
const composedStyles = mergeFinixStyles(appearance.styles, { dark: { input: { default: { color: "white" } } } });
const readController = (controller: UseFinixPaymentFormResult): boolean => controller.canSubmit;

interface AppTheme {
  mode: "light" | "dark";
  focusColor: `#${string}`;
}

const adaptHostedAppearance = defineFinixHostedAppearanceAdapter<AppTheme>()((theme) => ({
  theme: theme.mode === "dark" ? "midnight" : "finix",
  styles: {
    default: {
      input: { focused: { borderColor: theme.focusColor } },
    },
  },
}));
const adaptedAppearance = adaptHostedAppearance({ mode: "dark", focusColor: "#00ffff" });
const adaptedTheme: "finix" | "midnight" = adaptedAppearance.theme;
const adaptedFocusColor: `#${string}` = adaptedAppearance.styles.default.input.focused.borderColor;

defineFinixHostedAppearance({
  theme: "finix",
  // @ts-expect-error Structural form options are not hosted appearance options.
  showAddress: true,
});

defineFinixHostedAppearanceAdapter<AppTheme>()(() => ({
  theme: "finix",
  // @ts-expect-error Adapter output rejects keys outside the hosted appearance contract.
  paymentMethods: ["card"],
}));

const invalidEnvironment: FinixClientConfig = {
  // @ts-expect-error Finix.PaymentForm documents only sandbox and prod.
  environment: "live",
  applicationId: "AP_invalid",
};
const invalidAuthEnvironment: FinixAuthConfig = {
  // @ts-expect-error Finix.Auth documents sandbox and live, not prod.
  environment: "prod",
  merchantId: "MU_invalid",
};
const cannotHideCardNumber: FinixPaymentFormOptions = {
  // @ts-expect-error Card number cannot be hidden.
  hideFields: ["number"],
};
const cannotPrefillSensitiveData: FinixPaymentFormOptions = {
  defaultValues: {
    // @ts-expect-error Raw payment values must never be accepted as defaults.
    number: "4111111111111111",
  },
};
const invalidPaymentMethodOrder: FinixPaymentFormOptions = {
  // @ts-expect-error The official combined order is card then bank.
  paymentMethods: ["bank", "card"],
};
const onSubmit: FinixOnSubmit = () => undefined;
onSubmit(null, { data: { id: "TK_success" }, token: "TK_success" });
onSubmit(new FinixSdkError("tokenization_failed", "failed"), null);
// @ts-expect-error Finix callbacks never return neither an error nor a response.
onSubmit(null, null);
// @ts-expect-error Finix callbacks never return both an error and a response.
onSubmit(new FinixSdkError("tokenization_failed", "failed"), { data: { id: "TK_invalid" }, token: "TK_invalid" });

void clientConfig;
void authConfig;
void options;
void invalidEnvironment;
void invalidAuthEnvironment;
void cannotHideCardNumber;
void cannotPrefillSensitiveData;
void invalidPaymentMethodOrder;
void onSubmit;
void focusedBorder;
void hostedAppearance;
void composedStyles;
void adaptedTheme;
void adaptedFocusColor;
void readController;
void FinixForm.Root;
void FinixForm.Host;
void FinixForm.Consumer;
