import { Result } from '../utils/safeZone';

/**
 * JSON 파싱 옵션
 */
export interface JsonParsingOptions {
  /** 기본값 (파싱 실패 시 반환) */
  fallback?: unknown;
  /** 타입 검증 함수 */
  validator?: (value: unknown) => boolean;
  /** 문자열에서 JSON 패턴 추출 허용 */
  extractPattern?: boolean;
}

/**
 * 안전한 JSON 파싱 (Result 타입 반환)
 */
export function safeJsonParse<T = unknown>(json: string): Result<T> {
  try {
    const parsed = JSON.parse(json);
    return {
      success: true,
      result: parsed as T,
    };
  } catch (error) {
    return {
      success: false,
      reason: error,
    };
  }
}

/**
 * 기본값을 가진 JSON 파싱
 */
export function parseJsonWithFallback<T>(
  json: string,
  fallback: T,
  options?: JsonParsingOptions
): T {
  if (!json || typeof json !== 'string') {
    return fallback;
  }

  const { validator, extractPattern = false } = options ?? {};

  try {
    let jsonStr = json.trim();

    // JSON 패턴 추출이 활성화된 경우
    if (extractPattern && !jsonStr.startsWith('{') && !jsonStr.startsWith('[')) {
      const extracted = extractJsonFromText(jsonStr);
      if (extracted !== null) {
        jsonStr = typeof extracted === 'string' ? extracted : JSON.stringify(extracted);
      }
    }

    const parsed = JSON.parse(jsonStr);

    // 타입 검증이 있는 경우
    if (validator && !validator(parsed)) {
      return fallback;
    }

    return parsed as T;
  } catch {
    return fallback;
  }
}

/**
 * 텍스트에서 JSON 패턴 추출
 * LLM 응답 등에서 JSON을 추출할 때 유용
 */
export function extractJsonFromText(text: string): unknown | null {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const trimmed = text.trim();

  // 직접적인 JSON 구조인 경우
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // fall through to pattern matching
    }
  }

  // JSON 배열 패턴 매칭 (가장 일반적)
  const arrayMatch = trimmed.match(/\[[\s\S]*?\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      // ignore
    }
  }

  // JSON 객체 패턴 매칭
  const objectMatch = trimmed.match(/\{[\s\S]*?\}/);
  if (objectMatch) {
    try {
      const parsed = JSON.parse(objectMatch[0]);
      return typeof parsed === 'object' && parsed !== null ? parsed : null;
    } catch {
      // ignore
    }
  }

  return null;
}

/**
 * JSON 배열 파싱 (LLM 키워드 추출 등에 특화)
 */
export function parseJsonArray(text: string, fallback: string[] = []): string[] {
  const result = parseJsonWithFallback(text, fallback, {
    validator: (value): value is string[] => Array.isArray(value),
    extractPattern: true,
  });

  // 배열이 아니거나 문자열이 아닌 요소가 있으면 필터링
  if (Array.isArray(result)) {
    return result.filter((item): item is string => typeof item === 'string');
  }

  return fallback;
}

/**
 * 타입 안전한 JSON 파싱 (제네릭 + 타입 가드)
 */
export function parseJsonTyped<T>(
  json: string,
  typeGuard: (value: unknown) => value is T,
  fallback: T
): T {
  return parseJsonWithFallback(json, fallback, { validator: typeGuard });
}

/**
 * 기본 parseJson 함수 (기존 Core 호환)
 * @deprecated Use safeJsonParse or parseJsonWithFallback for better error handling
 */
export function parseJson<T>(json: string): T {
  return JSON.parse(json) as T;
}
