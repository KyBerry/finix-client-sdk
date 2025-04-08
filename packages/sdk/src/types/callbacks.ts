import type { FormState, BinInformation } from "./form";

/**
 * Callback fired when form state changes
 */
export type OnUpdateCallback = (state: FormState, binInformation: BinInformation, formHasErrors: boolean) => void;

/**
 * Callback fired when the form is fully loaded
 */
export type OnLoadCallback = () => void;

/**
 * Callback for form submission handling
 */
export type OnSubmitCallback = () => void;

/**
 * Response structure from the Finix API after tokenization
 */
export type FinixTokenResponse = {
  data?: {
    id: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

/**
 * Callback received after form submission completes
 */
export type SubmitCallback = (err: Error | null, res: FinixTokenResponse) => void;
