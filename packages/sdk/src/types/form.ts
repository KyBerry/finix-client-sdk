import type { FinixFormFieldName } from "./fields";

/**
 * Status of the Finix SDK initialization
 */
export enum INIT_STATUS {
  NOT_STARTED = "not_started",
  INITIALIZING = "initializing",
  READY = "ready",
  FAILED = "failed",
}

/**
 * BIN information returned by the form for card processing
 */
export type BinInformation = {
  readonly bin?: string;
  readonly cardBrand?: string;
};

/**
 * Current state of the form's field values
 */
export type FormState = Record<FinixFormFieldName, string | undefined>;

export type FormId = string & { readonly _brand: unique symbol };
