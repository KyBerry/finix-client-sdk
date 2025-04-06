import { FieldState, FormField } from "../../core/types";
import { FIELD_UPDATE, FieldAction } from "../actions/fieldActions";

/**
 * Reducer for managing field states
 * @param state Current field states
 * @param action Action to process
 * @returns Updated field states
 */
export function fieldReducer(state: Record<string, FormField> = {}, action: FieldAction): Record<string, FormField> {
  switch (action.type) {
    case FIELD_UPDATE: {
      const { fieldName, fieldState } = action.payload;
      const currentField = state[fieldName] || { ...fieldState };

      return {
        ...state,
        [fieldName]: {
          name: fieldName,
          state: {
            ...fieldState,
          },
        },
      };
    }

    default:
      return state;
  }
}
