export interface IdentifierValidationOptions {
  /** 최소 길이 (default: 2) */
  minLength?: number;
  /** 최대 길이 (default: 64) */
  maxLength?: number;
  /** 커스텀 패턴 (default: alphanumeric + ._-) */
  pattern?: RegExp;
  /** 유니코드 문자 허용 여부 (default: false) */
  allowUnicode?: boolean;
  /** 시작/끝 문자 제한 (default: alphanumeric only) */
  requireAlphanumericEnds?: boolean;
}

/**
 * 범용 식별자 유효성 검증
 * Agent ID, Session ID, Tool ID 등 다양한 식별자에 활용 가능
 */
export function validateIdentifier(id: string, options: IdentifierValidationOptions = {}): boolean {
  const {
    minLength = 2,
    maxLength = 64,
    pattern,
    allowUnicode = false,
    requireAlphanumericEnds = true,
  } = options;

  // 기본 길이 검증
  if (!id || id.length < minLength || id.length > maxLength) {
    return false;
  }

  // 커스텀 패턴이 있으면 우선 적용
  if (pattern) {
    return pattern.test(id);
  }

  // 기본 패턴: alphanumeric + ._-
  const basePattern = allowUnicode
    ? /^[\p{L}\p{N}][\p{L}\p{N}._-]*[\p{L}\p{N}]$/u
    : /^[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9]$/;

  // 단일 문자인 경우 시작/끝 제약 무시
  if (id.length === 1) {
    const singleCharPattern = allowUnicode ? /^[\p{L}\p{N}]$/u : /^[a-zA-Z0-9]$/;
    return singleCharPattern.test(id);
  }

  // 시작/끝 문자 제한을 적용하지 않는 경우
  if (!requireAlphanumericEnds) {
    const flexiblePattern = allowUnicode ? /^[\p{L}\p{N}._-]+$/u : /^[a-zA-Z0-9._-]+$/;
    return flexiblePattern.test(id);
  }

  return basePattern.test(id);
}

/**
 * Agent ID 전용 검증 (기존 호환성 유지)
 */
export function validateAgentId(agentId: string): boolean {
  return validateIdentifier(agentId, {
    minLength: 2,
    maxLength: 64,
    allowUnicode: false,
    requireAlphanumericEnds: true,
  });
}

/**
 * Session ID 검증 (더 유연한 규칙)
 */
export function validateSessionId(sessionId: string): boolean {
  return validateIdentifier(sessionId, {
    minLength: 1,
    maxLength: 128,
    allowUnicode: false,
    requireAlphanumericEnds: false,
  });
}

/**
 * Tool ID 검증 (유니코드 허용)
 */
export function validateToolId(toolId: string): boolean {
  return validateIdentifier(toolId, {
    minLength: 1,
    maxLength: 100,
    allowUnicode: true,
    requireAlphanumericEnds: true,
  });
}
