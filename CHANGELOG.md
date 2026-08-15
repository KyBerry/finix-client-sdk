# Changelog

All notable changes to this project are documented here. Versions follow Semantic Versioning.

## [Unreleased]

- Add object-form callbacks `onChange({ state, binInformation, hasErrors })` and `onSubmitResult({ ok, token, response, error })` alongside the positional `onUpdate` and `onSubmit`.
- `submit()` now resolves with `FinixSubmitResponse`, the validated response plus a top-level `token`.
- `FinixPaymentForm` accepts a render-prop child that receives the controller.
- Add `useFinixClient(config)` and `useFinixAppearance(appearance, scheme)` React hooks.
- Add `resolveFinixAppearance(appearance, scheme)` to flatten `styles.dark` for an app-controlled color scheme.
- `defineFinixStyles` and `mergeFinixStyles` accept a bare `{ input, form, ... }` object as the default mode; add `normalizeFinixStyles`.
- Warn in development when payment form options change without a new `instanceKey`.
- Set `scrolling="no"` on the hosted iframe so Finix's validation-row animation cannot flash a scrollbar.
- Add the `apps/docs` documentation site with live sandbox examples.

## [0.1.0] - 2026-08-14

- Add typed browser bindings around the supported Finix.js v2 payment form.
- Add optional React bindings through `@kyberry/finix-client-sdk/react`.
- Add headless `FinixForm.Root`, `Host`, and `Consumer` React primitives.
- Add exact hosted-appearance definitions, consumer-theme adapters, and property-level style composition.
- Preserve hosted input across React option rerenders and add explicit `instanceKey` recreation.
- Enforce one empty hosted-form mount per headless React root.
- Add an opt-in real-CDN Playwright canary for desktop light and mobile dark behavior.
- Publish dual ESM and CommonJS builds with TypeScript declarations.
- Add packed-consumer verification and npm trusted publishing with provenance.
- Migrate repository-owned configuration and release tooling to TypeScript.
- Remove obsolete vendor-script copies and legacy protocol documentation.
