# Payment Form SDK Implementation TODO

This document outlines the key components and features needed to build a modern payment form SDK compatible with Finix's APIs. Items marked [~] are partially addressed, [x] are considered complete by recent changes, and [-] denotes removal/replacement. New items or significantly updated ones are marked normally.

## Core Architecture

- [-] **Form Manager Class** (Replaced by PaymentFormCreator and BasePaymentForm structure)
- [x] **Field Management** (Core iframe creation via `renderFormFields` implemented)
  - [x] Refine DOM structure creation within `renderFormFields` (Added wrappers, labels, validation spans).
- [~] **State Management & Validity** (Base state initialization done, `field-updated` processing added. TokenForm needs state rework for toggling)
  - [x] Implement detailed state update logic within `handleMessage` to update `formState` based on `field-updated` messages.
  - [x] Implement processing of validation results received from iframes (via `errorMessages` in `field-updated` messages).
  - [x] Implement robust tracking of overall form validity (`_checkFormValidity`).
  - [x] Refactor `TokenPaymentForm` state management to handle dynamic switching between card/bank views.

## Iframe Implementation

- [x] **Iframe URL Construction** (Handled by `createIframeFieldConfig` and `renderFormFields`)
- [ ] **Hosted Field Page** (External to this SDK's code, assumed to exist at `IFRAME_URL`)
- [x] **Field Configuration** (Handled by `IframeFieldConfig` type and `createIframeFieldConfig` utility)
  - [x] Fix empty validation strings handling in iframe config
  - [x] Fix autocomplete values for bank fields
  - [x] Add proper support for address_region field defaults

## Communication Protocol

- [x] **Parent-to-Iframe Messaging**
  - [-] Implement methods in `BasePaymentForm` or products to send messages (e.g., focus, blur, potentially style updates if needed). (Submit is implemented via postMessage, other messages not identified as needed yet).
- [x] Implement `submit` method in products to send 'submit' message via `postMessage`.
  - [ ] Refactor common `submit` logic into `BasePaymentForm`.
- [x] **Iframe-to-Parent Messaging** (Listener setup done, core message handling implemented & tested)
  - [x] Implement `handleMessage` logic in `BasePaymentForm` for `field-updated`.
  - [x] Implement `handleMessage` logic for `bin-information-received`.
  - [x] Implement `handleMessage` logic for `response-received` and `response-error` messages.
  - [x] Handle `field-updated` message type.
  - [x] Handle `bin-information-received` message type.
  - [x] Handle `response-received`, `response-error` message types.
  - [ ] Handle `form-submit` message type (if used by iframes - needs confirmation).
- [~] **Message Security** (Basic origin validation implemented & tested).
  - Review if origin (`https://js.finix.com`) is stable/correct for all environments.
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
- [x] **Event System** (Callbacks defined, most invoked & tested)
  - [x] `onUpdate` called after `field-updated` / `bin-information-received`.
  - [x] `onValidationError` called when errors received.
  - [x] Invoke `onLoad` callback after initial rendering is complete (Tested via `render`).
  - [x] Invoke `onSubmit`, `onTokenize`, `onTokenizeError` from submission/response handling logic (onTokenize/Error tested via `handleMessage`).

## Finix API Integration

- [x] **Tokenization** (Handled via iframe `postMessage("submit")` mechanism)
- [~] **API Compatibility** (Ensure `EnvironmentConfig` and data sent via `postMessage` align with iframe expectations, especially `data` payload in submit).
- [~] **Fraud Detection Integration**
  - [~] Thoroughly test `PaymentFormCreator.initializeFraudDetection` (Basic tests added, mock refinement needed).
  - [~] Implement robust error handling for fraud session initialization failures (Basic tests added).
  - [x] Ensure `fraudSessionId` from `this.environment` is correctly passed/used if needed by the iframe config or submission process (Passed via `environment` object to form constructors, tested via `renderForm`).

## Configuration Options

- [x] **Field Display Options** (Showing/hiding via `hideFields`/`getVisibleFields`, dynamic display based on country).
- [x] **Label/Placeholder Handling**
  - [x] Ensure labels are created and populated in `renderFormFields`.
  - [x] Verify `createIframeFieldConfig` prioritizes config `placeholders`.
- [x] **Styling System** (`styles` config passed to iframe, base CSS injection implemented).
  - [x] Implement Base CSS injection in `BasePaymentForm.render` (`_injectBaseStyles`).
  - [x] Centralize submit button styling into base CSS.
- [ ] **Localization**
  - Consider if labels/placeholders/error messages need internationalization support beyond simple configuration overrides.

## Developer Experience

- [x] **Core Public API** (`PaymentFormCreator`, essential types exported from `index.ts`)
  - [ ] Add comprehensive JSDoc comments to exported classes, methods, and types.
- [ ] **Developer Tools**
  - [ ] Add more detailed logging options (e.g., configurable log levels).
  - [x] Standardize logging messages (use consistent prefixes/levels).
  - [x] Implement initialization validation in PaymentFormCreator constructor (Added basic checks).
- [ ] **Error Handling**
  - [ ] Improve user-facing error messages for configuration issues or runtime problems (e.g., container not found).

## Testing and Quality

- [~] **Unit Tests** (Good coverage, some areas like state edge cases and conditional types need more)
  - [x] Add tests for `PaymentFormCreator` logic (Core creation, fraud init, and validation tested).
  - [x] Add tests for `createIframeFieldConfig` merging logic (Enhanced & refactored).
  - [x] Add tests for `BasePaymentForm` message handling and core callbacks (Refactored & verified).
  - [x] Add tests for object utilities (cleanObject, filterObject, deepMerge).
  - [x] Add tests for UUID utilities (createBrandedId, generateTimestampedId).
  - [x] Test TokenPaymentForm's unique toggle functionality and payment instrument type selection (Fixed and Tested).
  - [x] Add thorough tests for `submit` method implementation in all product forms (Base class tested, individual forms verify payload type).
  - [x] Test BankPaymentForm country-specific field display logic (Refactored & verified).
  - [x] Add tests for error message handling and validation display.
  - [x] Add parent-to-iframe messaging tests.
  - [x] Test CardPaymentForm country-specific field display logic (Fixed).
  - [~] Test field state management for all form types (basic implementation added, needs more edge cases, especially for TokenForm toggling).
  - Test conditional type logic in `types/index.ts`.
- [ ] **Integration Tests**
  - Requires a test environment with the hosted iframe page.
  - Test form rendering with various configurations.
  - Test message passing between parent and iframe.
- [ ] **Cross-Browser Testing**
  - Verify iframe and postMessage behavior in all major browsers.
  - Test form layout and styling in different browsers.
  - Verify console error handling across browsers.

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
  - [x] Refine `PaymentInstrumentType` handling (Update property on toggle).
  - [x] Implement `submit` logic differences if needed (Currently only adds `paymentInstrumentType`).
  - [x] Fix state management during toggle (`_switchToPaymentType`, `_initializeStateForDisplayType`).
- [x] **BankPaymentForm Enhancements**
  - [x] Implement dynamic field display logic (bank fields/address) based on country.
- [x] **CardPaymentForm Enhancements**
  - [x] Implement dynamic address field display logic (State/Region) based on country (Tested).

## Housekeeping

- [x] Rename `base-form-creator.ts` to `payment-form-creator.ts` (User confirmed manual rename).
- [ ] Remove unused helper types/functions if any remain.
- [ ] Refactor duplicated field rendering logic from product forms into `BasePaymentForm` or utils.

## Documentation

- [x] Create test documentation (Added packages/sdk/src/**tests**/README.md).
- [ ] Document best practices for error handling and field validation.
- [ ] Create full API documentation with examples.
- [ ] Add integration guides for common frameworks (React, Vue, etc.).
