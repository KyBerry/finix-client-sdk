import { BinInformation, FieldState, PaymentType, Environment, FormId, ApplicationId, FormOptions, FormState, FieldName, FormError } from "../core/types";

/**
 * Specific action types for form state management
 */
export type FormActionType = "FIELD_UPDATE" | "FIELD_FOCUS" | "FIELD_BLUR" | "FORM_SUBMIT" | "FORM_SUBMIT_SUCCESS" | "FORM_SUBMIT_ERROR" | "FORM_RESET" | "BIN_INFORMATION_UPDATE";

/**
 * Typed action creators for form actions with discriminated union
 */
export type FormActions = { type: "FIELD_UPDATE"; payload: { fieldName: FieldName; value: string } } | { type: "FIELD_FOCUS"; payload: { fieldName: FieldName } } | { type: "FIELD_BLUR"; payload: { fieldName: FieldName } } | { type: "FORM_SUBMIT"; payload: void } | { type: "FORM_SUBMIT_SUCCESS"; payload: { tokenId: string } } | { type: "FORM_SUBMIT_ERROR"; payload: { errors: FormError[] } } | { type: "FORM_RESET"; payload: void } | { type: "BIN_INFORMATION_UPDATE"; payload: { binInfo: BinInformation } };

/**
 * Generic action structure for our Flux/Redux pattern.
 */
export interface Action<T extends string, P = void> {
  /** String literal type identifying the action */
  readonly type: T;
  /** Data associated with the action */
  readonly payload: P;
}

/**
 * Helper type to extract the action type from an action.
 */
export type ActionType<A> = A extends Action<infer T, any> ? T : never;

/**
 * Helper type to extract the payload type from an action.
 */
export type ActionPayload<A> = A extends Action<any, infer P> ? P : never;

/**
 * A pure function that takes the current state and an action,
 * then returns a new state.
 */
export type Reducer<S, A extends Action<string, any> = any> = (state: S, action: A) => S;

/**
 * A function that receives state updates.
 */
export type Subscriber<S> = (state: S) => void;

/**
 * Interface for error handlers used in the store.
 */
export type ErrorHandler<TState, TAction extends Action<string, any> = any> = (
  error: Error,
  phase: "dispatch" | "reduce" | "notify",
  context: {
    readonly state: TState;
    readonly action?: TAction;
    readonly listener?: Subscriber<TState>;
  },
) => void;

/**
 * Interface for the API exposed to middleware.
 */
export type MiddlewareAPI<TState, TAction extends Action<string, any> = any> = {
  readonly getState: () => TState;
  readonly dispatch: (action: TAction) => void;
};

/**
 * Middleware function signature with better type constraints.
 */
export type Middleware<TState, TAction extends Action<string, any> = any> = (api: MiddlewareAPI<TState, TAction>) => (next: (action: TAction) => void) => (action: TAction) => void;

/**
 * Core store interface that implements the Flux pattern.
 */
export interface IStore<S, A extends Action<string, any> = any> {
  /** Get the current state */
  getState(): S;
  /** Dispatch an action to update state */
  dispatch(action: A): void;
  /** Subscribe to state changes */
  subscribe(subscriber: Subscriber<S>): () => void;
}

/**
 * Form-specific store with additional methods
 */
export interface FormStore<T extends PaymentType = PaymentType> extends IStore<FormState<T>, FormActions> {
  /** Tokenizes the form data and returns a token */
  tokenize(): Promise<string>;
  /** Resets the form to its initial state */
  reset(): void;
  /** Validates all fields and returns validity */
  validate(): boolean;
}
