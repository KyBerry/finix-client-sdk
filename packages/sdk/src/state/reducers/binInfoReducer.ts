import { BinInformation } from "../../core/types";
import { BIN_INFORMATION_UPDATE, BinInformationUpdateAction } from "../actions/binInfoActions";

/**
 * Default initial state for BIN information
 */
const initialState: BinInformation = {
  bin: "",
  cardBrand: "unknown",
};

/**
 * Reducer for managing BIN information state
 * @param state Current BIN information state
 * @param action Action to process
 * @returns Updated BIN information state
 */
export function binInfoReducer(state: BinInformation = initialState, action: BinInformationUpdateAction): BinInformation {
  switch (action.type) {
    case BIN_INFORMATION_UPDATE:
      return {
        ...state,
        ...action.payload.binInfo,
      };
    default:
      return state;
  }
}
