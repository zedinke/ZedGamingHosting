/**
 * Result<T> wrapper for standardized error handling
 * Prevents throwing exceptions, uses functional error handling instead
 */

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Creates a successful result
 */
export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Creates a failed result
 */
export function err<E = Error>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Checks if result is successful
 */
export function isOk<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success;
}

/**
 * Checks if result is failed
 */
export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}

/**
 * Unwraps result, throwing if failed
 * Use with caution - prefer pattern matching
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.success) {
    return result.data;
  }
  throw result.error;
}

/**
 * Unwraps result with default value if failed
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.success) {
    return result.data;
  }
  return defaultValue;
}


