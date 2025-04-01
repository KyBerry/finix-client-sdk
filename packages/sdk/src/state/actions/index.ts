import { FieldAction } from "./fieldActions";
import { FormAction } from "./formActions";
import { BinInformationUpdateAction } from "./binInfoActions";

export type AppAction = FieldAction | FormAction | BinInformationUpdateAction;
