/**
 * Deep clones an object, ensuring all nested objects and arrays are new instances
 * This is essential for immutable state management in the game engine
 */
export function deepClone<T>(obj: T): T {
  // Handle null and undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle primitive types
  if (typeof obj !== 'object') {
    return obj;
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  // Handle Arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as T;
  }

  // Handle Objects
  const clonedObj = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }

  return clonedObj;
}

/**
 * Creates a deep clone of a GameState for safe mutations
 */
export function cloneGameState<T extends Record<string, any>>(state: T): T {
  return deepClone(state);
}
