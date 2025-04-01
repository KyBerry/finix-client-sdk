import { FieldName, FormId } from "../../core/types";

/**
 * Action type constants for field-related actions
 */
export const FIELD_UPDATE = "FIELD_UPDATE";
export const FIELD_FOCUS = "FIELD_FOCUS";
export const FIELD_BLUR = "FIELD_BLUR";

/**
 * Action type for updating a field's value
 */
export interface FieldUpdateAction {
  readonly type: typeof FIELD_UPDATE;
  readonly payload: {
    readonly formId: FormId;
    readonly fieldName: FieldName;
    readonly value: string;
  };
}

/**
 * Action type for focusing a field
 */
export interface FieldFocusAction {
  readonly type: typeof FIELD_FOCUS;
  readonly payload: {
    readonly formId: FormId;
    readonly fieldName: FieldName;
  };
}

/**
 * Action type for blurring a field
 */
export interface FieldBlurAction {
  readonly type: typeof FIELD_BLUR;
  readonly payload: {
    readonly formId: FormId;
    readonly fieldName: FieldName;
  };
}

/**
 * Union type of all field-related actions
 */
export type FieldAction = FieldUpdateAction | FieldFocusAction | FieldBlurAction;

/**
 * Create an action to update a field's value
 * @param formId The form ID
 * @param fieldName The field name
 * @param value The new field value
 * @returns A field update action
 */
export function updateField(formId: FormId, fieldName: FieldName, value: string): FieldUpdateAction {
  return {
    type: FIELD_UPDATE,
    payload: { formId, fieldName, value },
  };
}

/**
 * Create an action to focus a field
 * @param formId The form ID
 * @param fieldName The field name
 * @returns A field focus action
 */
export function focusField(formId: FormId, fieldName: FieldName): FieldFocusAction {
  return {
    type: FIELD_FOCUS,
    payload: { formId, fieldName },
  };
}

/**
 * Create an action to blur a field
 * @param formId The form ID
 * @param fieldName The field name
 * @returns A field blur action
 */
export function blurField(formId: FormId, fieldName: FieldName): FieldBlurAction {
  return {
    type: FIELD_BLUR,
    payload: { formId, fieldName },
  };
}
