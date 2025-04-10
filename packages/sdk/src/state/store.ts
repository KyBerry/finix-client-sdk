/**
 * Type definitions for the Store
 */

/**
 * A reducer function that accepts the current state and an action,
 * then returns a new state.
 */
export type Reducer<TState, TAction = unknown> = (state: TState, action: TAction) => TState;

/**
 * A subscriber function that gets called whenever the state changes.
 */
export type Subscriber<TState> = (state: TState) => void;

/**
 * Error handler for tracking issues across different phases of state management.
 */
export type ErrorHandler<TState, TAction = unknown> = (
  error: Error,
  phase: "dispatch" | "reduce" | "notify",
  context: {
    state: TState;
    action?: TAction;
    listener?: Subscriber<TState>;
  },
) => void;

/**
 * API surface exposed to middleware.
 */
export type MiddlewareAPI<TState, TAction = unknown> = {
  getState: () => TState;
  dispatch: (action: TAction) => void;
};

/**
 * Middleware signature for processing actions before they hit the reducer.
 */
export type Middleware<TState, TAction = unknown> = (api: MiddlewareAPI<TState, TAction>) => (next: (action: TAction) => void) => (action: TAction) => void;

/**
 * A predictable state container inspired by Redux.
 * Includes features like middleware and time-travel debugging.
 */
export class Store<TState, TAction = unknown> {
  private state: TState;
  private currentIndex: number = 0;
  private timeTravelEnabled: boolean = false;
  private reducer: Reducer<TState, TAction>;
  private listeners: Subscriber<TState>[] = [];
  private errorHandler: ErrorHandler<TState, TAction>;
  private middlewares: Middleware<TState, TAction>[] = [];
  private history: { state: TState; action: TAction | null }[] = [];

  /**
   * Creates a new Store instance.
   *
   * @param initialState The starting state for the store
   * @param reducer The reducer function that processes actions
   * @param options Optional configuration settings
   */
  constructor(
    initialState: TState | undefined,
    reducer: Reducer<TState, TAction>,
    options?: {
      enableTimeTravel?: boolean;
      errorHandler?: ErrorHandler<TState, TAction>;
    },
  ) {
    // Use initialState or create empty object as fallback
    this.state = initialState as TState;
    this.reducer = reducer;
    this.timeTravelEnabled = options?.enableTimeTravel || false;

    // Set up default error handling
    this.errorHandler =
      options?.errorHandler ||
      ((error, phase, context) => {
        console.error(`[Error in store]: Phase: ${phase}, Error: ${error.message}`, context);
      });

    // Initialize history tracking if time travel is enabled
    if (this.timeTravelEnabled && initialState) {
      this.history.push({ state: this.deepClone(initialState), action: null });
    }
  }

  /**
   * Returns the current state of the store.
   * Returns a deep copy to maintain immutability.
   */
  public getState(): TState {
    return this.deepClone(this.state);
  }

  /**
   * Applies middleware to the store.
   * Middleware gets applied in the order provided.
   *
   * @param middleware List of middleware functions to apply
   */
  public applyMiddleware(...middleware: Middleware<TState, TAction>[]): void {
    this.middlewares = middleware;
  }

  /**
   * Dispatches an action to the store.
   * This triggers the state update pipeline:
   * 1. Middleware processing (if any)
   * 2. Reducer application
   * 3. History recording (if time travel enabled)
   * 4. Listener notification
   *
   * @param action The action object to process
   */
  public dispatch(action: TAction): void {
    // If we have middleware, use the enhanced dispatch function
    if (this.middlewares.length > 0) {
      // Create a middleware API for each middleware to access
      const middlewareAPI: MiddlewareAPI<TState, TAction> = {
        getState: this.getState.bind(this),
        dispatch: this.dispatch.bind(this),
      };

      // Transform each middleware into its middleware function
      const chain = this.middlewares.map((middleware) => middleware(middlewareAPI));

      // Create the base dispatch function
      const baseDispatch = (action: TAction) => {
        try {
          // Apply the reducer to get the next state
          const newState = this.reducer(this.state, action);
          this.state = newState;

          // Handle time travel history recording
          if (this.timeTravelEnabled) {
            if (this.currentIndex < this.history.length - 1) {
              // We're in the middle of history, truncate the future
              this.history = this.history.slice(0, this.currentIndex + 1);
            }

            // Add new history entry
            this.history.push({
              state: this.deepClone(this.state),
              action,
            });
            this.currentIndex = this.history.length - 1;
          }

          // Notify listeners
          this.notifyListeners(action);
        } catch (error) {
          // Handle reducer errors
          this.errorHandler(error instanceof Error ? error : new Error(String(error)), "reduce", { state: this.state, action });
        }
      };

      // Build the middleware pipeline from right to left
      const composedMiddleware = chain.reduceRight((next, middleware) => middleware(next), baseDispatch);

      // Run the action through our pipeline
      composedMiddleware(action);
    } else {
      // No middleware, use direct dispatch
      try {
        const newState = this.reducer(this.state, action);
        this.state = newState;

        if (this.timeTravelEnabled) {
          if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
          }

          this.history.push({
            state: this.deepClone(this.state),
            action,
          });
          this.currentIndex = this.history.length - 1;
        }

        // Notify listeners
        this.notifyListeners(action);
      } catch (error) {
        this.errorHandler(error instanceof Error ? error : new Error(String(error)), "reduce", { state: this.state, action });
      }
    }
  }

  /**
   * Jumps to a specific point in history.
   * Only works if time travel is enabled.
   *
   * @param index History index to jump to
   */
  public jump(index: number): void {
    if (!this.timeTravelEnabled) return;

    if (index >= 0 && index < this.history.length) {
      const historyItem = this.history[index];

      // Safety check
      if (!historyItem) return;

      this.currentIndex = index;
      this.state = this.deepClone(historyItem.state);

      // Notify listeners with the historical action for context
      this.notifyListeners(historyItem.action || undefined);
    }
  }

  /**
   * Returns a copy of the history stack.
   * Each entry contains both state and action.
   */
  public getHistory(): Array<{ state: TState; action: TAction | null }> {
    if (!this.timeTravelEnabled) return [];

    // Return a deep copy to prevent history manipulation
    return this.history.map((item) => ({
      state: this.deepClone(item.state),
      action: item.action,
    }));
  }

  /**
   * Subscribes a listener to state changes.
   * Returns an unsubscribe function for cleanup.
   *
   * @param listener Function to call on state changes
   * @returns Function to call to unsubscribe
   */
  public subscribe(listener: Subscriber<TState>): () => void {
    this.listeners.push(listener);

    // Return a cleanup function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) this.listeners.splice(index, 1);
    };
  }

  /**
   * Notify all listeners of state changes.
   * Handles errors in listeners gracefully.
   *
   * @param action The action that caused the state change
   */
  private notifyListeners(action?: TAction): void {
    const currentState = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(currentState);
      } catch (error) {
        // Don't let one bad listener crash the whole notification system
        this.errorHandler(error instanceof Error ? error : new Error(String(error)), "notify", { state: currentState, action, listener });
      }
    }
  }

  /**
   * Recursive deep clone implementation.
   * Makes sure we never accidentally mutate the state.
   *
   * @param obj Object to clone
   * @returns Deep copy of the object
   */
  private deepClone<TValue>(obj: TValue): TValue {
    if (obj === null || typeof obj !== "object") return obj;

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map((item) => this.deepClone(item)) as unknown as TValue;
    }

    // Handle objects
    const cloned = {} as TValue;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    return cloned;
  }
}

/**
 * Creates a new Store instance.
 * Convenience factory function.
 *
 * @param initialState The initial state of the store
 * @param reducer A reducer function
 * @param options Optional configuration
 * @returns A new store instance
 */
export function createStore<TState, TAction = unknown>(
  initialState: TState | undefined,
  reducer: Reducer<TState, TAction>,
  options?: {
    enableTimeTravel?: boolean;
    errorHandler?: ErrorHandler<TState, TAction>;
  },
): Store<TState, TAction> {
  return new Store<TState, TAction>(initialState, reducer, options);
}
