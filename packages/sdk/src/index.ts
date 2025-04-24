/**
 * Finix SDK - Main entry point
 * Provides secure payment tokenization in the browser
 * Optimized for usage with React, Next.js and modern module systems
 *
 * IMPORTANT: This SDK is SSR-compatible but loads Sift Science
 * fraud detection on the client side. Some functionality will
 * only be available in browser environments.
 */

// --- Core Creator ---
export { PaymentFormCreator } from "./creators/payment-form-creator";

// --- Core Types ---
export type {
  // Configuration Types
  EnvironmentConfig,
  FormConfig,
  // Core Enum/Union Types
  FormType,
  // Supporting Types for Configuration
  StylesConfig,
  FontConfig,
  Placeholder,
  FormCallbacks,
  // State & Response Types
  FieldState,
  FormState, // Note: This is generic, might be complex for end-users
  FinixTokenResponse,
  // Field Name Types (might be useful for callbacks/state inspection)
  FieldName,
  CardFieldName,
  BankFieldName,
  AddressFieldName,
  // Other related types if needed by consumers
  // AvailableFieldNames, // Potentially too complex for direct export?
  // HideableField,
  // ... etc
} from "./types";
