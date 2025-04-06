import { FormError, FormId, TokenId } from "../../core/types";

/**
 * Action type constants for form-related actions
 */
export const FORM_SUBMIT = "FORM_SUBMIT";
export const FORM_SUBMIT_SUCCESS = "FORM_SUBMIT_SUCCESS";
export const FORM_SUBMIT_ERROR = "FORM_SUBMIT_ERROR";
export const FORM_RESET = "FORM_RESET";

/**
 * Action type for initiating form submission
 */
export interface FormSubmitAction {
  readonly type: typeof FORM_SUBMIT;
  readonly payload: {
    readonly formId: FormId;
  };
}

/**
 * Action type for successful form submission
 */
export interface FormSubmitSuccessAction {
  readonly type: typeof FORM_SUBMIT_SUCCESS;
  readonly payload: {
    readonly formId: FormId;
    readonly tokenId: TokenId;
  };
}

/**
 * Action type for failed form submission
 */
export interface FormSubmitErrorAction {
  readonly type: typeof FORM_SUBMIT_ERROR;
  readonly payload: {
    readonly formId: FormId;
    readonly errors: readonly FormError[];
  };
}

/**
 * Union type of all form-related actions
 */
export type FormAction = FormSubmitAction | FormSubmitSuccessAction | FormSubmitErrorAction;

/**
 * Create an action to initiate form submission
 * @param formId The form ID
 * @returns A form submit action
 */
export function submitForm(formId: FormId): FormSubmitAction {
  return {
    type: FORM_SUBMIT,
    payload: { formId },
  };
}

/**
 * Create an action for successful form submission
 * @param formId The form ID
 * @param tokenId The token ID from the successful submission
 * @returns A form submit success action
 */
export function submitFormSuccess(formId: FormId, tokenId: TokenId): FormSubmitSuccessAction {
  return {
    type: FORM_SUBMIT_SUCCESS,
    payload: { formId, tokenId },
  };
}

/**
 * Create an action for failed form submission
 * @param formId The form ID
 * @param errors Errors from the failed submission
 * @returns A form submit error action
 */
export function submitFormError(formId: FormId, errors: readonly FormError[]): FormSubmitErrorAction {
  return {
    type: FORM_SUBMIT_ERROR,
    payload: { formId, errors },
  };
}
