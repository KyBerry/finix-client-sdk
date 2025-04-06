import { FieldName, FieldState, FormId } from "../../core/types";

/**
 * Action type constants for field-related actions
 */
export const FIELD_UPDATE = "FIELD_UPDATE";
export const FIELD_FOCUS = "FIELD_FOCUS";
export const FIELD_BLUR = "FIELD_BLUR";

/**
 * Action type for updating a field's value
 */
export type FieldUpdateAction = {
  readonly type: typeof FIELD_UPDATE;
  readonly payload: {
    readonly formId: FormId;
    readonly fieldName: string;
    readonly fieldState: FieldState;
  };
};

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
 * Union type of all field-related actions
 */
export type FieldAction = FieldUpdateAction | FieldFocusAction;

/**
 * Create an action to update a field's value
 * @param formId The form ID
 * @param fieldName The field name
 * @param state The new field state
 * @returns A field update action
 */
export function updateField(formId: FormId, fieldName: string, fieldState: FieldState): FieldUpdateAction {
  return {
    type: FIELD_UPDATE,
    payload: { formId, fieldName, fieldState },
  };
}
