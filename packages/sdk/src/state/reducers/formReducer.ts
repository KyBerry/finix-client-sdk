import { FormError } from "../../core/types";
import { FORM_SUBMIT, FORM_SUBMIT_SUCCESS, FORM_SUBMIT_ERROR, FORM_RESET, FormAction } from "../actions/formActions";

/**
 * State shape for the form submission status
 */
export interface FormSubmissionState {
  readonly isSubmitting: boolean;
  readonly submitErrors?: readonly FormError[];
}

/**
 * Initial state for form submission
 */
const initialState: FormSubmissionState = {
  isSubmitting: false,
  submitErrors: undefined,
};

/**
 * Reducer for managing form submission state
 * @param state Current form submission state
 * @param action Action to process
 * @returns Updated form submission state
 */
export function formReducer(state: FormSubmissionState = initialState, action: FormAction): FormSubmissionState {
  switch (action.type) {
    case FORM_SUBMIT:
      return {
        ...state,
        isSubmitting: true,
        submitErrors: undefined,
      };

    case FORM_SUBMIT_SUCCESS:
      return {
        ...state,
        isSubmitting: false,
        submitErrors: undefined,
      };

    case FORM_SUBMIT_ERROR:
      return {
        ...state,
        isSubmitting: false,
        submitErrors: action.payload.errors,
      };

    case FORM_RESET:
      return initialState;

    default:
      return state;
  }
}
