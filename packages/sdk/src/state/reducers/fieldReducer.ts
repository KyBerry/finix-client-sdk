import { FieldState } from "../../core/types";
import { validateField } from "../../core/validators";
import { FIELD_UPDATE, FIELD_FOCUS, FIELD_BLUR, FieldAction } from "../actions/fieldActions";

/**
 * Default initial state for a field
 */
const initialFieldState: FieldState = {
  value: "",
  isFocused: false,
  isDirty: false,
  isValid: false,
  errorMessages: [],
};

/**
 * Reducer for managing field states
 * @param state Current field states
 * @param action Action to process
 * @returns Updated field states
 */
export function fieldReducer(state: Record<string, FieldState> = {}, action: FieldAction): Record<string, FieldState> {
  switch (action.type) {
    case FIELD_UPDATE: {
      const { fieldName, value } = action.payload;
      const currentField = state[fieldName] || { ...initialFieldState };

      // Validate the field
      const validation = validateField(fieldName, value);

      return {
        ...state,
        [fieldName]: {
          ...currentField,
          value,
          isDirty: true,
          isValid: validation.isValid,
          errorMessages: validation.isValid ? [] : [validation.errorMessage || `Invalid ${fieldName}`],
        },
      };
    }

    case FIELD_FOCUS: {
      const { fieldName } = action.payload;
      const currentField = state[fieldName] || { ...initialFieldState };

      return {
        ...state,
        [fieldName]: {
          ...currentField,
          isFocused: true,
        },
      };
    }

    case FIELD_BLUR: {
      const { fieldName } = action.payload;
      const currentField = state[fieldName] || { ...initialFieldState };

      // Only validate on blur if the field has been modified
      if (!currentField.isDirty) {
        return {
          ...state,
          [fieldName]: {
            ...currentField,
            isFocused: false,
          },
        };
      }

      // Revalidate on blur
      const validation = validateField(fieldName, currentField.value);

      return {
        ...state,
        [fieldName]: {
          ...currentField,
          isFocused: false,
          isValid: validation.isValid,
          errorMessages: validation.isValid ? [] : [validation.errorMessage || `Invalid ${fieldName}`],
        },
      };
    }

    default:
      return state;
  }
}
