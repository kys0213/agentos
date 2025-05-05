export function safeZone<T>(fn: () => T | Promise<T>): Promise<Result<T>> | Result<T> {
  try {
    const result = fn();

    if (isPromise(result)) {
      return result
        .then((result) => ({
          success: true as const,
          result,
        }))
        .catch((reason) => ({
          success: false as const,
          reason,
        }));
    }

    return {
      success: true as const,
      result,
    };
  } catch (error) {
    return {
      success: false as const,
      reason: error,
    };
  }
}

function isPromise<T>(value: T | Promise<T>): value is Promise<T> {
  return value instanceof Promise;
}

type SuccessResult<T> = { success: true; result: T };
type ErrorResult = { success: false; reason: unknown };
type Result<T> = SuccessResult<T> | ErrorResult;
