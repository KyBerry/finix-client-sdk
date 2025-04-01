/**
 * Browser-compatible UUID generator
 * This replaces the Node.js crypto.randomUUID() with a client-side implementation
 * using Math.random().
 *
 * For production use, consider using crypto.randomUUID() when available,
 * with this implementation as a fallback.
 */
export function generateUUID(): string {
  // Check if native crypto.randomUUID is available (modern browsers)
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // Fallback implementation for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a unique ID with a timestamp prefix
 * Useful for creating identifiers that are both unique and roughly sortable
 */
export function generateTimestampedId(prefix = ""): string {
  return `${prefix}${Date.now()}-${generateUUID()}`;
}

/**
 * Create a branded id type from a string
 * This is useful for creating FormId, ApplicationId, etc.
 * @param id The string to convert to a branded type
 * @returns The branded id
 */
export function createBrandedId<T>(id: string): T {
  return id as unknown as T;
}
