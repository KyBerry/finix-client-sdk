/**
 * EventEmitter class for handling custom events
 */
export class EventEmitter {
  private events: Map<string, Function[]> = new Map();

  /**
   * Subscribe to an event
   * @param event - The event name to subscribe too
   * @param listener - The callback function to execute when the event is triggered
   * @returns A function to unsubscribe from the event
   */
  public on(event: string, listener: Function): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    const listeners = this.events.get(event)!;
    listeners.push(listener);

    // Return an unsubscribe function
    return () => this.off(event, listener);
  }

  /**
   * Unsubscribe from an event
   * @param event The event name to unsubscribe from
   * @param listenerToRemove The callback function to remove
   */
  public off(event: string, listenerToRemove: Function) {
    if (!this.events.has(event)) return;

    const listeners = this.events.get(event)!;
    const index = listeners.indexOf(listenerToRemove);

    if (index !== -1) {
      listeners.splice(index, 1);

      // If no listeners remain, remove the event entirely
      if (listeners.length === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * Emit an event with the provided arguments
   * @param event The event name to emit
   * @param args The arguments to pass to the listeners
   */
  public emit<T>(event: string, ...args: T[]): void {
    if (!this.events.has(event)) return;

    const listeners = this.events.get(event)!;
    listeners.forEach((listener) => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Subscribe to an event and automatically unsubscribe after it fires once
   * @param event The event name to subscribe to
   * @param listener The callback function to execute when the event is emitted
   * @returns A function that can be called to unsubscribe from the event
   */
  once(event: string, listener: Function): () => void {
    const unsubscribe = this.on(event, (...args: any[]) => {
      unsubscribe();
      listener(...args);
    });

    return unsubscribe;
  }

  /**
   * Remove all listeners for a specific event, or all events if no event is specified
   * @param event Optional event name to clear listeners for
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * Get the number of listeners for a specific event
   * @param event The event name to check
   * @returns The number of listeners for the event
   */
  listenerCount(event: string): number {
    return this.events.has(event) ? this.events.get(event)!.length : 0;
  }
}
