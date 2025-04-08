import { DEFAULT_PRESETS } from "@/presets";

import type { StylesConfig, FontConfig } from "./styling";
import type { FINIX_ENVIRONMENT } from "@/types";
import type { OnUpdateCallback, OnLoadCallback, OnSubmitCallback } from "./callbacks";
import type { HideableFieldName, RequirableFieldName, FinixFormFieldName, DefaultValueFieldName } from "./fields";

export type FinixConfigOptions = {
  readonly environment: FINIX_ENVIRONMENT;
  readonly applicationId: string;
  readonly merchantId: string;
};

/**
 * Configuration for custom field labels
 */
export type LabelsConfig = Partial<Record<FinixFormFieldName, string>>;

/**
 * Configuration for field placeholders
 */
export type PlaceholdersConfig = Partial<Record<FinixFormFieldName, string>>;

/**
 * Configuration for pre-filled default values
 */
export type DefaultValuesConfig = Partial<Record<DefaultValueFieldName, string>>;

/**
 * Configuration for custom error messages
 */
export type ErrorMessagesConfig = Partial<Record<FinixFormFieldName, string>>;

/**
 * Main configuration interface for Finix TokenForm
 */
export type FinixTokenFormOptions = {
  // Display options
  showAddress?: boolean;
  showLabels?: boolean;
  showPlaceholders?: boolean;
  hideErrorMessages?: boolean;

  // Field customization
  labels?: LabelsConfig;
  placeholders?: PlaceholdersConfig;
  defaultValues?: DefaultValuesConfig;
  hideFields?: HideableFieldName[];
  requiredFields?: RequirableFieldName[];
  errorMessages?: ErrorMessagesConfig;

  // Visual customization
  styles?: StylesConfig;
  fonts?: FontConfig[];

  // Event handlers
  onUpdate?: OnUpdateCallback;
  onLoad?: OnLoadCallback;
  onSubmit?: OnSubmitCallback;

  // Submit button
  submitLabel?: string;
};

export type DefaultPresets = keyof typeof DEFAULT_PRESETS;
