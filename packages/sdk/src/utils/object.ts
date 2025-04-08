import merge from "lodash.merge";

/**
 * Creates a new object with all properties from the input object
 * that are not undefined and are own properties.
 *
 * @param obj - The source object to clean
 * @returns A new object without undefined values
 */
export function cleanObject<T extends Record<keyof T, unknown>>(obj: T): Partial<T> {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  const result: Partial<T> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }

  return result;
}

/**
 * Creates a new object with all properties from the input object
 * that pass the provided predicate function.
 *
 * @param obj - The source object to filter
 * @param predicate - Function to test each property value
 * @returns A new filtered object
 */
export function filterObject<T extends Record<keyof T, unknown>>(obj: T, predicate: (value: unknown, key: string, obj: T) => boolean): Partial<T> {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  const result: Partial<T> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && predicate(obj[key], key, obj)) {
      result[key] = obj[key];
    }
  }

  return result;
}

/**
 * Deep merge utility function to combine defaults with user options
 * Uses lodash.merge for better performance and reliability
 *
 * @param target The base object to merge into
 * @param sources Any number of objects to merge from
 * @returns A new object with properties from both objects deeply merged
 */
export function deepMerge<T extends Record<string, unknown>>(target: T, ...sources: Partial<T>[]): T {
  return merge({}, target, ...sources);
}

// We can also export lodash.merge directly if needed
export { merge };
