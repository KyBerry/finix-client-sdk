// Generic action type
export type Action<T extends string, P = void> = {
  type: T;
  payload: P;
};

// Type helpers for actions
export type ActionType<A> = A extends Action<infer T, unknown> ? T : never;
export type ActionPayload<A> = A extends Action<string, infer P> ? P : never;
