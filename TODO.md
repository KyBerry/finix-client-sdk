# Payment Form SDK Implementation TODO

This document outlines the key components and features needed to build a modern payment form SDK compatible with Finix's APIs. Items marked [~] are partially addressed, [x] are considered complete by recent changes, and [-] denotes removal/replacement. New items or significantly updated ones are marked normally.

## Core Architecture

- [-] **Form Manager Class** (Replaced by PaymentFormCreator and BasePaymentForm structure)
- [~] **Field Management** (Core iframe creation via `renderFormFields` implemented)
  - [x] Refine DOM structure creation within `renderFormFields` (Added wrappers, labels, validation spans).
- [~] **State Management & Validity** (Base state initialization done, `field-updated` processing added)
  - [x] Implement detailed state update logic within `handleMessage` to update `formState` based on `field-updated` messages.
  - [x] Implement processing of validation results received from iframes (via `errorMessages` in `field-updated` messages).
  - [x] Implement robust tracking of overall form validity (`_checkFormValidity`).

## Iframe Implementation

- [x] **Iframe URL Construction** (Handled by `createIframeFieldConfig` and `renderFormFields`)
- [ ] **Hosted Field Page** (External to this SDK's code, assumed to exist at `IFRAME_URL`)
- [x] **Field Configuration** (Handled by `IframeFieldConfig` type and `createIframeFieldConfig` utility)

## Communication Protocol

- [ ] **Parent-to-Iframe Messaging**
  - Implement methods in `BasePaymentForm` or products to send messages (e.g., focus, blur, potentially style updates if needed).
- [x] Implement `submit` method in products to send 'submit' message via `postMessage`.
- [~] **Iframe-to-Parent Messaging** (Listener setup done, core message handling implemented)
  - [x] Implement `handleMessage` logic in `BasePaymentForm` for `field-updated`, `bin-information-received`.
  - [x] Implement `handleMessage` logic for `response-received` and `response-error` messages.
  - [x] Handle `field-updated` message type.
  - [x] Handle `bin-information-received` message type.
  - [x] Handle `response-received`, `response-error` message types.
  * Handle `form-submit` message type (if used by iframes).
- [x] **Message Security** (Basic origin validation implemented).
  - Review if additional security measures (message IDs, etc.) are needed based on iframe implementation details.

## Form Features

- [x] Process `errorMessages` received from iframes in `handleMessage`.
- [x] Connect `FieldState.errorMessages` to the dedicated DOM validation message containers.
- [x] **Field Formatting** (Handled within iframe).
- [x] **Form Submission & State** (Submit implemented, button created & state updated).
  - [x] Implement `postMessage` logic in `submit` methods.
  - [x] Implement response handling (`response-received`, `response-error`) within `handleMessage`.
  - [x] Implement `addSubmitButton` to create button.
  - [x] Implement `updateSubmitButtonState` to enable/disable button.
- [x] **Event System** (Callbacks defined, most invoked)
  - [x] `onUpdate` called after `field-updated` / `bin-information-received`.
  - [x] `onValidationError` called when errors received.
  - Invoke `onLoad` callback after initial rendering is complete (e.g., end of `BasePaymentForm.render`).
  - Invoke `onSubmit`, `onTokenize`, `onTokenizeError` from submission/response handling logic.

## Finix API Integration

- [x] **Tokenization** (Handled via iframe `postMessage("submit")` mechanism)
- [ ] **API Compatibility** (Ensure `EnvironmentConfig` and data sent via `postMessage` align with iframe expectations)
- [ ] **Fraud Detection Integration**
  - Thoroughly test `PaymentFormCreator.initializeFraudDetection`.
  - Implement robust error handling for fraud session initialization failures.
  - Ensure `fraudSessionId` from `this.environment` is correctly passed/used if needed by the iframe config or submission process (currently passed via `environment` object to form constructors).

## Configuration Options

- [x] **Field Display Options** (Showing/hiding via `hideFields`/`getVisibleFields`, dynamic display based on country).
- [x] **Label/Placeholder Handling**
  - [x] Ensure labels are created and populated in `renderFormFields`.
  - [x] Verify `createIframeFieldConfig` prioritizes config `placeholders`.
- [x] **Styling System** (`styles` config passed to iframe, base CSS injected).
  - [x] Implement Base CSS injection in `BasePaymentForm.render`.
- [ ] **Localization**
  - Consider if labels/placeholders/error messages need internationalization support beyond simple configuration overrides.

## Developer Experience

- [x] **Core Public API** (`PaymentFormCreator`, essential types exported from `index.ts`)
  - Add comprehensive JSDoc comments to exported classes, methods, and types.
- [ ] **Developer Tools**
  - Add more detailed logging options (e.g., configurable log levels).
  - Implement initialization validation in `PaymentFormCreator` constructor (e.g., check for valid `EnvironmentConfig`).
- [ ] **Error Handling**
  - Improve user-facing error messages for configuration issues or runtime problems.

## Testing and Quality

- [ ] **Unit Tests**
  - Add tests for `PaymentFormCreator` logic.
  - Add tests for `createIframeFieldConfig` merging logic.
- [ ] **Integration Tests**
  - Requires a test environment with the hosted iframe page.
  - Test form rendering with various configurations.
  - Test message passing between parent and iframe.
- [ ] **Browser Compatibility** (Standard testing procedure)

## Advanced Features

- [ ] **Card Validation** (BIN lookup, brand detection - likely depends on `bin-information-received` message)
- [ ] **Address Verification** (If required - potentially new fields/config)
- [ ] **Security Features**
  - Support 3D Secure integration (likely involves specific callbacks/event handling based on Finix API requirements).

## Performance Optimization

- [ ] **Loading Performance**
  - Review if base CSS injection impacts perceived load time.
- [ ] **Runtime Performance**
  - Profile event handling and state updates under heavy usage.

## Specific Product Implementations

- [x] **TokenPaymentForm Enhancements**
  - [x] Implement the Card/Bank toggle button UI.
  - [~] Refine `PaymentInstrumentType` handling (Currently defaults to CARD, may need iframe check).
  - [ ] Implement `submit` logic differences if needed.
- [x] **BankPaymentForm Enhancements**
  - [x] Implement dynamic field display logic (bank fields/address) based on country.
- [x] **CardPaymentForm Enhancements**
  - [x] Implement dynamic address field display logic (State/Region) based on country.

## Housekeeping

- [x] Rename `base-form-creator.ts` to `payment-form-creator.ts` (User confirmed manual rename).
- [ ] Remove unused helper types/functions if any remain.
- [ ] Standardize logging messages (use consistent prefixes/levels).
