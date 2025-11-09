export type ShimmyErrorCode =
  | 'PORT_IN_USE'
  | 'START_TIMEOUT'
  | 'HEALTHCHECK_FAILED'
  | 'MODEL_NOT_FOUND'
  | 'DOWNLOAD_FAILED'
  | 'UNSUPPORTED_ACCEL';

export interface ShimmyErrorOptions {
  code: ShimmyErrorCode;
  message: string;
  cause?: unknown;
  details?: Record<string, unknown>;
}

export class ShimmyError extends Error {
  readonly code: ShimmyErrorCode;
  readonly cause?: unknown;
  readonly details?: Record<string, unknown>;

  constructor(options: ShimmyErrorOptions) {
    super(options.message);
    this.name = 'ShimmyError';
    this.code = options.code;
    this.cause = options.cause;
    this.details = options.details;
  }
}

export const isShimmyError = (value: unknown): value is ShimmyError => {
  if (value instanceof ShimmyError) {
    return true;
  }
  if (value && typeof value === 'object') {
    const candidate = value as Record<string, unknown>;
    return typeof candidate.code === 'string' && typeof candidate.message === 'string';
  }
  return false;
};

export const toShimmyError = (error: unknown, fallback: ShimmyErrorOptions): ShimmyError => {
  if (isShimmyError(error)) {
    return error instanceof ShimmyError
      ? error
      : new ShimmyError({
          code: (error as { code: ShimmyErrorCode }).code,
          message: (error as { message: string }).message,
          details: (error as { details?: Record<string, unknown> }).details,
          cause: (error as { cause?: unknown }).cause,
        });
  }

  if (error instanceof Error) {
    return new ShimmyError({
      code: fallback.code,
      message: fallback.message,
      cause: error,
      details: fallback.details,
    });
  }

  return new ShimmyError(fallback);
};
