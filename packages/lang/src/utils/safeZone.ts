export interface SafeZoneOptions {
  logger?: {
    error?: (error: unknown) => void;
  };
  retries?: number;
  retryDelay?: number;
}

type SuccessResult<T> = { success: true; result: T };
type ErrorResult = { success: false; reason: unknown };
export type Result<T> = SuccessResult<T> | ErrorResult;

export function safeZone<T>(
  fn: () => T | Promise<T>,
  options?: SafeZoneOptions
): Promise<Result<T>> | Result<T> {
  const { logger, retries = 0, retryDelay = 0 } = options ?? {};

  const execute = (attempt: number = 0): Promise<Result<T>> | Result<T> => {
    try {
      const result = fn();

      if (isPromise(result)) {
        return result
          .then((result) => ({
            success: true as const,
            result,
          }))
          .catch((reason) => {
            logger?.error?.(reason);

            if (attempt < retries) {
              if (retryDelay > 0) {
                return new Promise<Result<T>>((resolve) => {
                  setTimeout(() => {
                    const retryResult = execute(attempt + 1);
                    if (isPromise(retryResult)) {
                      retryResult.then(resolve);
                    } else {
                      resolve(retryResult);
                    }
                  }, retryDelay);
                });
              }
              const retryResult = execute(attempt + 1);
              return retryResult as Promise<Result<T>>;
            }

            return {
              success: false as const,
              reason,
            };
          });
      }

      return {
        success: true as const,
        result,
      };
    } catch (error) {
      logger?.error?.(error);

      if (attempt < retries) {
        if (retryDelay > 0) {
          return new Promise<Result<T>>((resolve) => {
            setTimeout(() => {
              const retryResult = execute(attempt + 1);
              if (isPromise(retryResult)) {
                retryResult.then(resolve);
              } else {
                resolve(retryResult);
              }
            }, retryDelay);
          });
        }
        return execute(attempt + 1);
      }

      return {
        success: false as const,
        reason: error,
      };
    }
  };

  return execute();
}

export function isPromise<T>(value: T | Promise<T>): value is Promise<T> {
  return value instanceof Promise;
}
