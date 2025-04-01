import { BinInformation, FormId } from "../../core/types";

/**
 * Action type constant for BIN information updates
 */
export const BIN_INFORMATION_UPDATE = "BIN_INFORMATION_UPDATE";

/**
 * Action type for updating BIN information
 */
export interface BinInformationUpdateAction {
  readonly type: typeof BIN_INFORMATION_UPDATE;
  readonly payload: {
    readonly formId: FormId;
    readonly binInfo: BinInformation;
  };
}

/**
 * Create an action to update the BIN information
 * @param formId The form ID
 * @param binInfo The new BIN information
 * @returns A BIN information update action
 */
export function updateBinInformation(formId: FormId, binInfo: BinInformation): BinInformationUpdateAction {
  return {
    type: BIN_INFORMATION_UPDATE,
    payload: { formId, binInfo },
  };
}
