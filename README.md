# `@kyberry/finix-client-sdk`

Typed browser and React bindings for the official [Finix.js v2](https://docs.finix.com/js) payment form.

**Documentation and live examples:** https://kyberry.github.io/finix-client-sdk/

> [!IMPORTANT]
> This is an independent, unofficial open-source package. It is not maintained, endorsed, or certified by Finix. It loads Finix's hosted JavaScript and payment form; it does not replace the Finix SDK or make your integration PCI compliant by itself. Review Finix's current documentation and your own compliance requirements before going live.

The package provides:

- an idempotent loader for `https://js.finix.com/v/2/finix.js`;
- a typed `FinixClient` and lifecycle-safe `PaymentFormInstance`;
- Promise-based mounting and submission with timeout and abort support;
- runtime validation and normalized `FinixSdkError` errors;
- exact hosted-appearance definitions, design-system adapters, and deep style composition helpers;
- headless React primitives with automatic mount and cleanup; and
- typed `Finix.Auth` session handling.

The Finix script is not included in this package. Finix requires it to be loaded directly from `js.finix.com`, not self-hosted or bundled.

## Installation

```bash
npm install @kyberry/finix-client-sdk
```

The package declares Node.js 20 or newer for server-side imports and tooling. React `>=18.2 <20` is an optional peer dependency unless you import the React entry point; the core entry has no React runtime dependency.

## Browser usage

```html
<div id="payment-form"></div>
<button id="submit" type="button" disabled>Save payment method</button>
```

```ts
import { FinixClient, FinixSdkError, type PaymentFormInstance } from "@kyberry/finix-client-sdk";

const client = new FinixClient({
  environment: "sandbox",
  applicationId: "YOUR_SANDBOX_APPLICATION_ID",
});

let form: PaymentFormInstance;

try {
  form = await client.mount("payment-form", {
    paymentMethods: ["card"],
    showAddress: true,
    onChange({ hasErrors }) {
      document.querySelector<HTMLButtonElement>("#submit")!.disabled = hasErrors;
    },
    onError(error) {
      console.error(error.code, error.message);
    },
  });
} catch (error) {
  if (error instanceof FinixSdkError) {
    console.error(error.code, error.message);
  }
  throw error;
}

document.querySelector("#submit")!.addEventListener("click", async () => {
  const { token } = await form.submit();

  // Send only the short-lived token to your backend. Claim it immediately by
  // creating a Payment Instrument with an authenticated server-side request.
  await fetch("/api/payment-instruments", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token }),
  });
});

// On route teardown or when the host is no longer needed:
// form.destroy();
```

`FinixClient.mount()` resolves after Finix reports that the hosted form is initialized. The returned form starts with `hasErrors === true`, rejects concurrent submissions, validates token responses, and cleans up idempotently with `destroy()`. `submit()` resolves with the validated Finix response plus `token` (the same value as `data.id`).

Callbacks come in two shapes. `onChange({ state, binInformation, hasErrors })` and `onSubmitResult({ ok, token, response, error })` are the object forms; `onUpdate(state, binInformation, hasErrors)` and `onSubmit(error, response)` match Finix's positional signatures. Use whichever you prefer; both stay supported.

### Finix-managed submit button

Providing `onSubmit` asks Finix to render and manage its own submit button. The two arguments are explicitly nullable and exactly one should be non-null:

```ts
const form = await client.mount("payment-form", {
  submitLabel: "Save payment method",
  onSubmit(error, response) {
    if (error !== null) {
      console.error(error.code, error.message);
      return;
    }
    if (response === null) return;

    void fetch("/api/payment-instruments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: response.data.id }),
    });
  },
});
```

When `onSubmit` is omitted, render your own button and call `form.submit()` as in the first example. Do not use both patterns for the same user action.

## React and Next.js

Import React bindings from the dedicated subpath. For the common case where the form and your button sit together, `FinixPaymentForm` is one tag with a render prop, and `useFinixClient` builds a stable client:

```tsx
"use client";

import { FinixPaymentForm, useFinixClient } from "@kyberry/finix-client-sdk/react";

export function PaymentForm() {
  const client = useFinixClient({ environment: "sandbox", applicationId: process.env.NEXT_PUBLIC_FINIX_APPLICATION_ID! });

  return (
    <FinixPaymentForm client={client} options={{ paymentMethods: ["card"], showAddress: true }}>
      {(form) => (
        <button type="button" disabled={!form.canSubmit} onClick={() => void form.submit().then(({ token }) => save(token))}>
          {form.isSubmitting ? "Saving…" : "Save payment method"}
        </button>
      )}
    </FinixPaymentForm>
  );
}
```

### Headless primitives

When the button or status lives elsewhere in your tree, use the headless pieces. `FinixForm.Root` owns the controller but renders no DOM, `FinixForm.Host` is the iframe mount point, and `FinixForm.Consumer` exposes state and actions through a render prop. Everything around the hosted fields remains your markup:

```tsx
"use client";

import { FinixForm, useFinixClient } from "@kyberry/finix-client-sdk/react";

export function PaymentForm() {
  const client = useFinixClient({
    environment: "sandbox",
    applicationId: process.env.NEXT_PUBLIC_FINIX_APPLICATION_ID!,
  });

  return (
    <FinixForm.Root client={client} options={{ paymentMethods: ["card"], showAddress: true }}>
      <section className="checkout-card">
        <h2>Payment details</h2>
        <FinixForm.Host className="secure-fields" aria-label="Secure payment fields" />

        <FinixForm.Consumer>
          {(controller) => (
            <>
              {controller.error || controller.submissionError ? (
                <p role="alert">{(controller.submissionError ?? controller.error)?.message}</p>
              ) : null}
              <button
                type="button"
                className="brand-button"
                disabled={!controller.canSubmit}
                onClick={() => {
                  void controller
                    .submit()
                    .then(async ({ token }) => {
                      await fetch("/api/payment-instruments", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ token }),
                      });
                    })
                    .catch(() => {
                      // submissionError contains the normalized Finix failure.
                    });
                }}
              >
                {controller.isSubmitting ? "Saving…" : "Save payment method"}
              </button>
            </>
          )}
        </FinixForm.Consumer>
      </section>
    </FinixForm.Root>
  );
}
```

The headless controller exposes `status`, `form`, sanitized `state`, `binInformation`, `hasErrors`, `canSubmit`, `isSubmitting`, lifecycle `error`, `submissionError`, `submit()`, and `clearSubmissionError()`. The host adds `data-finix-status`, `data-finix-valid`, `data-finix-submitting`, and `data-finix-error` attributes so it can also be styled without reading context.

Use exactly one self-closing `FinixForm.Host` per `FinixForm.Root`. The SDK enforces that ownership boundary and rejects host children or `dangerouslySetInnerHTML`, because Finix owns the mount node. The lower-level `useFinixPaymentForm` hook exposes the same controller when you do not want context, while `useFinixPaymentFormContext` reads the nearest root. `FinixPaymentForm` renders the host `div` and, when `children` is a function, your UI right after it with the same controller.

Options are snapshotted when a hosted form instance is created. Rerendering with a new options object or appearance does not silently replace the iframe and erase payment details; callback implementations still stay current. When replacement is intentional, change the primitive `instanceKey` on `FinixForm.Root`, `FinixPaymentForm`, or `useFinixPaymentForm`:

```tsx
<FinixForm.Root client={client} options={options} instanceKey={checkoutAttempt}>
  {/* changing checkoutAttempt deliberately destroys and recreates the hosted form */}
</FinixForm.Root>
```

In development, the SDK logs a warning when options change without a new `instanceKey`, so a silent no-op is easy to spot. All React bindings destroy their owned form on unmount.

`useFinixAppearance(appearance, "light" | "dark")` returns `{ appearance, instanceKey }` for the color scheme your app is showing (see Form configuration below), so one appearance object with `styles.default` and `styles.dark` can follow an in-app theme toggle.

Package imports are safe during server rendering, but Finix.js itself is browser-only. `loadFinix()`, `FinixClient.mount()`, and the React mount effect require `window` and `document`; call them only in client components or browser lifecycle code. A server-side `loadFinix()` call rejects with `FinixSdkError` code `not_browser`.

## Loading Finix.js directly

`FinixClient.mount()` loads the script automatically. Use `loadFinix()` only when you need to warm the script or coordinate it with application startup:

```ts
import { loadFinix } from "@kyberry/finix-client-sdk";

const nonce = document.querySelector<HTMLMetaElement>('meta[name="csp-nonce"]')?.content;

await loadFinix({
  nonce,
  timeoutMs: 15_000,
});
```

Concurrent calls share one network load. The loader rejects conflicting Finix script versions and retries cleanly after a failed load. The URL is fixed to the official v2 CDN; there is no option to mirror or replace it.

## Finix.Auth

Finix documents `Finix.Auth` for fraud-session tracking. Initialize it before the payment form, then send its session key to your backend alongside the token:

```ts
import { createFinixAuth } from "@kyberry/finix-client-sdk";

const auth = await createFinixAuth({
  environment: "sandbox",
  merchantId: "YOUR_SANDBOX_MERCHANT_ID",
});

const fraudSessionId = auth.getSessionKey();

async function sendPaymentToken(tokenId: string) {
  await fetch("/api/payment-instruments", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: tokenId, fraudSessionId }),
  });
}
```

Your backend passes the value as `fraud_session_id` when it creates the relevant Authorization or Transfer. Use `await auth.connect(nextMerchantId)` to establish a new session when switching sellers. Payment forms use environments `sandbox | prod`; Auth follows Finix's separate `sandbox | live` contract.

See the official [Finix.Auth reference](https://docs.finix.com/js/auth) and [fraud detection guide](https://docs.finix.com/guides/online-payments/fraud-and-risk/fraud-detection) for the complete client/server lifecycle.

## Form configuration

`FinixPaymentFormOptions` follows the official [PaymentForm options](https://docs.finix.com/js/options):

- payment methods: card, bank, or both;
- address, label, placeholder, required-field, hidden-field, and error-message controls;
- Finix themes, dark mode, custom CSS-in-JS styles, and HTTPS-hosted fonts;
- security-code and bank-account confirmation settings;
- Plaid Link settings for bank accounts; and
- `onLoad`, `onChange` / `onUpdate`, `onSubmitResult` / `onSubmit`, and wrapper-level `onError` callbacks.

Finix's supported style targets are `form`, `input`, `sectionHeader`, `section`, and `submitButton`, with the state keys described in its [Styles & Fonts reference](https://docs.finix.com/js/styles-and-fonts). The SDK forwards styles to the hosted form and does not inject payment-field CSS into your page.

Parent-page CSS and custom properties cannot cross the iframe boundary. Style your layout, status, errors, and manual submit controls normally; pass resolved `styles` and HTTPS-hosted `fonts` for Finix-owned fields. `FinixHostedAppearance` intentionally excludes structural fields, defaults, Plaid settings, and callbacks. The definition helpers preserve literal types, reject extra appearance keys, and validate shared configuration immediately:

```ts
import {
  defineFinixHostedAppearance,
  defineFinixHostedAppearanceAdapter,
  defineFinixStyles,
  mergeFinixStyles,
} from "@kyberry/finix-client-sdk";

// A bare { input, form, ... } object is treated as the default (light) mode.
const foundation = defineFinixStyles({
  input: {
    default: { border: "1px solid #cbd5e1", borderRadius: 10, padding: "12px 14px" },
    focused: { borderColor: "#2563eb" },
    error: { borderColor: "#dc2626", color: "#991b1b" },
  },
});

const checkoutAppearance = defineFinixHostedAppearance({
  enableDarkMode: true,
  labels: { card_holder_name: "Name on card" },
  styles: mergeFinixStyles(foundation, {
    dark: {
      input: { default: { backgroundColor: "#0f172a", color: "#f8fafc" } },
    },
  }),
});

interface AppTheme {
  fieldBackground: string;
  fieldText: string;
  focusRing: string;
}

const appTheme: AppTheme = {
  fieldBackground: "#ffffff",
  fieldText: "#0f172a",
  focusRing: "rgba(37, 99, 235, 0.2)",
};

const adaptAppTheme = defineFinixHostedAppearanceAdapter<AppTheme>()((theme) => ({
  styles: {
    default: {
      input: {
        default: { backgroundColor: theme.fieldBackground, color: theme.fieldText },
        focused: { boxShadow: `0 0 0 3px ${theme.focusRing}` },
      },
    },
  },
}));

const brandedAppearance = adaptAppTheme(appTheme);
```

`defineFinixHostedAppearanceAdapter()` is deliberately consumer-theme-first: your application keeps ownership of its tokens and resolves them to literal values Finix can receive. `mergeFinixStyles()` merges modes, targets, states, and individual CSS properties in source order, so a brand layer can override one property without erasing the rest of a shared design-system layer. `defineFinixPaymentFormOptions()` is available for reusable complete configurations. All raw `FinixPaymentFormOptions` fields remain supported; the helpers are optional.

Finix applies `styles.dark` only when the iframe's own `prefers-color-scheme` is dark, which cannot follow an in-app theme toggle. `resolveFinixAppearance(appearance, "light" | "dark")` flattens one appearance for the scheme your app is showing (merging `dark` over `default` and setting `enableDarkMode` for dark; dropping `dark` for light). In React, `useFinixAppearance` wraps it and also returns an `instanceKey` that changes with the scheme.

### What headless means here

The React architecture is headless around the payment form, not inside Finix's security boundary. You own the checkout shell, content, status, errors, buttons, and responsive layout. Finix v2 owns one iframe containing the sensitive card or bank fields, and its public API exposes one `PaymentForm` mount plus form-level options and styles.

Finix does not currently document independently mountable card-number, expiration, or security-code components. Its field IDs configure labels, placeholders, validation text, visibility, and defaults where permitted; they are not DOM slots. This SDK therefore does not expose `CardNumberField`-style components, reach into the cross-origin iframe, or combine multiple form instances into one tokenization flow. If arbitrary placement of raw payment inputs is a requirement, discuss Finix's separately approved [raw card data](https://docs.finix.com/guides/online-payments/payment-tokenization/handling-raw-card-data) path and its compliance scope directly with Finix before designing that integration.

Two upstream details are worth making explicit:

- Finix's options prose lists `hidePotentialIssueMessages` as defaulting to `true`, while its example and current hosted runtime indicate `false`. This package does not choose between them: omit the option to accept Finix's current behavior, or set it explicitly for deterministic behavior.
- The hosted Canadian bank form uses `transit_number` and `institution_number`. Finix names them in its sensitive default-value restrictions and the hosted form supports them, but they are currently absent from the public Field IDs table. This package includes them as compatibility field IDs; confirm Canadian behavior in the Finix sandbox before launch.

Read the official [PaymentForm reference](https://docs.finix.com/js/payment-form), [field IDs](https://docs.finix.com/js/field-ids), [callbacks](https://docs.finix.com/js/callbacks), and [token response](https://docs.finix.com/js/token-response) before relying on vendor-specific behavior.

## Token and error handling

Finix token responses are exposed as `FinixTokenResponse`; the token is `response.data.id`. Treat it as short-lived, send it to your backend immediately, and use `expires_at` when present. Never put Finix API credentials in browser code and do not log raw callback payloads in production.

Wrapper failures use `FinixSdkError`, with a stable `code` and optional `details`/`cause`. `onSubmit` receives normalized tokenization or response errors. `onError` is reserved for wrapper lifecycle, validation, and callback failures; it does not replace `try`/`catch` around `mount()` and `submit()`.

## Security model and PCI boundary

The SDK's design goal is that primary account numbers never exist in your page. The topology it wraps:

```text
Your page (your markup, this SDK, your CSP)
└── One iframe from https://js.finix.com
    ├── The sensitive inputs, rendered by Finix
    └── Tokenization POST directly to finix.{sandbox,live}-payments-api.com
```

Card data is entered inside Finix's cross-origin iframe and submitted by that iframe directly to Finix's API. This SDK mounts the frame, forwards documented options, and returns the resulting token; no code path in this package reads, transports, or logs card data, and the browser's same-origin policy prevents your page from doing so accidentally.

This is the same embedded-iframe pattern that hosted-field products from other processors use to keep merchants eligible for SAQ A self-assessment. Eligibility is a determination you make with your acquirer and assessor, not a property a client library can grant — but the boundary this SDK maintains is the one SAQ A assumes. Anything that moves card entry into your own DOM (including Finix's separately approved raw-card-data API) changes that scope; treat such a change as a compliance decision first and an integration second.

## Content Security Policy

Finix does not publish an exhaustive CSP allowlist or a Subresource Integrity digest for the mutable v2 URL. Do not copy an observed script hash into production. At minimum, current browser behavior has been observed to require:

- `script-src https://js.finix.com`;
- `frame-src https://js.finix.com`; and
- when using Auth, connections to the matching Finix API environment and loading from `https://cdn.sift.com`.

This list is observational and non-exhaustive, not official Finix policy. Fraud tooling and future Finix releases may require other parent-page origins. Validate your full checkout in CSP Report-Only mode, review violation reports, and confirm the final policy with Finix. Pass your page's nonce through `loadFinix({ nonce })` or `FinixClient`'s `script.nonce` option when applicable.

A starting point for Report-Only validation on a page whose only third-party integration is this SDK with `Finix.Auth`:

```text
Content-Security-Policy-Report-Only:
  script-src 'self' https://js.finix.com https://cdn.sift.com;
  frame-src https://js.finix.com;
  connect-src 'self' https://finix.sandbox-payments-api.com https://finix.live-payments-api.com;
  img-src 'self' https://hexagon-analytics.com;
  report-uri /csp-reports
```

The `connect-src` entries cover `Finix.Auth`'s parent-page fraud-session request. Sift's current `s.js` reports via image beacons rather than XHR — the beacon host observed today is `hexagon-analytics.com`, which is exactly the kind of unannounced third-party detail that changes without notice; expect Report-Only violations to surface the current host rather than trusting this snapshot.

Requests made from inside Finix's iframe — tokenization, Plaid's loader, and custom iframe fonts — are governed by the iframe's own document, not your page's policy, so they do not need entries here.

## Known Finix platform behaviors

Findings from inspecting the current v2 hosted runtime; verify against the live sandbox before relying on them, and raise the surprising ones with Finix directly.

- **Plaid initializes on card-only forms.** The hosted frame loads `cdn.plaid.com` and creates a Plaid link token (`POST …/third_party_tokens`) during initialization even with `paymentMethods: ["card"]`. This costs load time and appears in your users' network activity, so account for it in privacy disclosures until Finix scopes it to bank forms.
- **Options are fixed at mount; restyling means remounting.** The hosted runtime has no restyle API, so changing `styles`, labels, or fonts requires a new frame — and each frame creation is a full Finix initialization, including the Plaid call above. The React bindings make this cost explicit through `instanceKey`; change it deliberately rather than deriving it from frequently changing state. The SDK's abort-aware mount already suppresses React StrictMode's development double-mount, so one rendered form costs one initialization.
- **Placeholder color is not customizable.** The hosted form's compiled stylesheet and bundle contain no `::placeholder` rule and no placeholder color option; placeholders render in the browser's default gray. Set `showPlaceholders: false` and rely on labels when the default gray fights your palette.
- **`destroy()` is present but undocumented.** The current CDN artifact exposes `destroy()` on the form instance, but Finix's public API reference does not document it. `PaymentFormInstance.destroy()` calls it when available and always removes the SDK-owned mount node, so cleanup does not depend on the undocumented method surviving.

## Development and release

```bash
pnpm install --frozen-lockfile
pnpm release:check
```

To run the browser playground, copy `apps/playground/.env.example` to `apps/playground/.env.local`, replace the placeholder with a sandbox Application ID, and run:

```bash
pnpm --filter @kyberry/finix-client-sdk-playground dev
```

An opt-in Playwright canary checks the current official Finix v2 CDN contract in desktop light mode and mobile dark mode without entering payment data or submitting a token:

```bash
pnpm --filter @kyberry/finix-client-sdk exec playwright install chromium
FINIX_SANDBOX_APPLICATION_ID=YOUR_SANDBOX_APPLICATION_ID \
  pnpm --filter @kyberry/finix-client-sdk test:live
```

The canary is intentionally separate from the deterministic unit and release gates because it depends on Finix, the public network, and a sandbox Application ID. The scheduled GitHub workflow runs only when the repository variable `FINIX_SANDBOX_APPLICATION_ID` is configured.

The root README is the canonical package README. The package's prepack hook stages it, together with the root license, into the npm tarball and removes only those staged copies afterward. See [docs/RELEASING.md](docs/RELEASING.md) for the trusted-publishing workflow.

Repository-owned source, configuration, and release tooling use TypeScript. The build necessarily emits JavaScript and CommonJS into ignored `dist/` directories for npm consumers; generated `.next/` and coverage output are ignored as well.

## License

[MIT](LICENSE)
