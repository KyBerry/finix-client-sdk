import { Environment, FormId, FormOptions, FormState, PaymentType } from "../../core/types";

import { fieldReducer } from "./fieldReducer";
import { formReducer } from "./formReducer";
import { binInfoReducer } from "./binInfoReducer";
import { FieldAction } from "../actions/fieldActions";
import { BinInformationUpdateAction } from "../actions/binInfoActions";

/**
 * Root action type combining all action types
 */
export type RootAction = {
  readonly type: string;
  readonly payload: {
    readonly formId?: FormId;
    readonly [key: string]: unknown;
  };
};

/**
 * Root reducer that combines all individual reducers
 * Applies the appropriate reducer to each slice of state
 *
 * @param state Current state tree
 * @param action Action to process
 * @returns New state tree with all updates applied
 */
export function rootReducer<T extends PaymentType>(state: FormState<T> | undefined, action: RootAction): FormState<T> {
  // Handle initialization
  if (!state) {
    throw new Error("Initial state must be provided to the store");
  }

  // Get form ID from action
  const actionFormId = getFormIdFromAction(action);
  const { formId } = state;

  // Only process actions for this form
  if (actionFormId && actionFormId !== formId) {
    return state;
  }

  // Apply individual reducers to each state slice
  return {
    ...state,
    fields: fieldReducer(state.fields, action as FieldAction),
    binInformation: binInfoReducer(state.binInformation, action as BinInformationUpdateAction),
    isSubmitting: formReducer(
      {
        isSubmitting: state.isSubmitting,
        submitErrors: state.submitErrors,
      },
      action as any,
    ).isSubmitting,
    submitErrors: formReducer(
      {
        isSubmitting: state.isSubmitting,
        submitErrors: state.submitErrors,
      },
      action as any,
    ).submitErrors,
  };
}

/**
 * Extract form ID from an action
 * @param action Action to extract form ID from
 * @returns Form ID if present, undefined otherwise
 */
function getFormIdFromAction(action: RootAction): FormId | undefined {
  if (!action?.payload) return undefined;
  return action.payload.formId as FormId | undefined;
}

/**
 * Create a form reducer for a specific form
 * @param formId Form ID
 * @param paymentType Payment type
 * @param environment Finix environment
 * @param applicationId Application ID
 * @returns A reducer function for the specific form
 */
export function createFormReducer<T extends PaymentType>(formId: FormId, paymentType: T, options: FormOptions) {
  // Return a reducer that only processes actions for this form
  return (state: FormState<T> | undefined, action: RootAction): FormState<T> => {
    // Initialize state if undefined
    if (!state) {
      return {
        formId,
        paymentType,
        binInformation: {
          bin: "",
          cardBrand: "unknown",
        },
        fields: {},
        isSubmitting: false,
        options,
      };
    }

    return rootReducer(state, action);
  };
}
