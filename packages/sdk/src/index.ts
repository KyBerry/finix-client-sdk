/**
 * Finix SDK - Main entry point
 * Provides secure payment tokenization in the browser
 * Optimized for usage with React, Next.js and modern module systems
 *
 * IMPORTANT: This SDK is SSR-compatible but loads Sift Science
 * fraud detection on the client side. Some functionality will
 * only be available in browser environments.
 */

// Export main classes
export { Finix } from "./core/finix";

// Export enum and constants
export { Environment, PAYMENT_INSTRUMENTS, CARD_BRANDS, InitializationStatus } from "./core/types";

// Export types (using export type for type re-exports)
export type { CardBrand, FormOptions, FieldOptions, StyleOptions, Font, Fonts, ValidationResult, BinInformation, FormId, ApplicationId, TokenId, FieldName, PaymentType, FormState, FormError } from "./core/types";

// Export validators for direct use
export { validateCardNumber, validateExpirationDate, validateSecurityCode, validateRoutingNumber, validateAccountNumber, validateName, validatePostalCode, detectCardBrand } from "./core/validators";

// Export store for advanced use cases
export { Store, createStore } from "./state/store";

// Export React integration
export { useFinixForm, FinixForm } from "./react/hooks";

// Export Next.js integration
export { NextFinixForm, useNextFinixForm, withClientSideRendering } from "./next/index";
