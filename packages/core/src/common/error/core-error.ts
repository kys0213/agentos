export type ErrorDomain =
  | 'common'
  | 'agent'
  | 'agent_manager'
  | 'agent_metadata'
  | 'agent_metadata_repository'
  | 'session'
  | 'chat'
  | 'preset'
  | 'mcp'
  | 'llm_bridge';

export type ErrorCode =
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'INVALID_ARGUMENT'
  | 'VALIDATION'
  | 'VERSION_CONFLICT'
  | 'CONFLICT'
  | 'UNAVAILABLE'
  | 'TIMEOUT'
  | 'ABORTED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'OPERATION_FAILED'
  | 'INTERNAL';

export interface CoreErrorOptions {
  cause?: unknown;
  details?: Record<string, unknown>;
  retryable?: boolean;
  transient?: boolean;
}

export class CoreError extends Error {
  readonly domain: ErrorDomain;
  readonly code: ErrorCode;
  readonly details?: Record<string, unknown>;
  readonly retryable?: boolean;
  readonly transient?: boolean;

  constructor(domain: ErrorDomain, code: ErrorCode, message: string, options?: CoreErrorOptions) {
    super(message);
    this.name = 'CoreError';
    this.domain = domain;
    this.code = code;
    this.details = options?.details;
    this.retryable = options?.retryable;
    this.transient = options?.transient;
    if (options?.cause && typeof (options.cause as any) === 'object') {
      try {
        // Node 16+: Error has cause option but keep compatibility
        (this as any).cause = options.cause;
      } catch {
        // ignore
      }
    }
  }
}

// Helper factories
export const Errors = {
  notFound: (domain: ErrorDomain, message: string, details?: Record<string, unknown>) =>
    new CoreError(domain, 'NOT_FOUND', message, { details }),
  alreadyExists: (domain: ErrorDomain, message: string, details?: Record<string, unknown>) =>
    new CoreError(domain, 'ALREADY_EXISTS', message, { details }),
  invalidArgument: (domain: ErrorDomain, message: string, details?: Record<string, unknown>) =>
    new CoreError(domain, 'INVALID_ARGUMENT', message, { details }),
  validation: (domain: ErrorDomain, message: string, details?: Record<string, unknown>) =>
    new CoreError(domain, 'VALIDATION', message, { details }),
  versionConflict: (domain: ErrorDomain, message: string, details?: Record<string, unknown>) =>
    new CoreError(domain, 'VERSION_CONFLICT', message, { details, retryable: true }),
  conflict: (domain: ErrorDomain, message: string, details?: Record<string, unknown>) =>
    new CoreError(domain, 'CONFLICT', message, { details }),
  unavailable: (domain: ErrorDomain, message: string, details?: Record<string, unknown>) =>
    new CoreError(domain, 'UNAVAILABLE', message, { details, transient: true, retryable: true }),
  timeout: (domain: ErrorDomain, message: string, details?: Record<string, unknown>) =>
    new CoreError(domain, 'TIMEOUT', message, { details, transient: true, retryable: true }),
  aborted: (domain: ErrorDomain, message: string, details?: Record<string, unknown>) =>
    new CoreError(domain, 'ABORTED', message, { details, transient: true }),
  unauthorized: (domain: ErrorDomain, message: string, details?: Record<string, unknown>) =>
    new CoreError(domain, 'UNAUTHORIZED', message, { details }),
  forbidden: (domain: ErrorDomain, message: string, details?: Record<string, unknown>) =>
    new CoreError(domain, 'FORBIDDEN', message, { details }),
  operationFailed: (domain: ErrorDomain, message: string, details?: Record<string, unknown>) =>
    new CoreError(domain, 'OPERATION_FAILED', message, { details }),
  internal: (domain: ErrorDomain, message: string, details?: Record<string, unknown>) =>
    new CoreError(domain, 'INTERNAL', message, { details }),
};
