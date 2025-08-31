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
export declare function safeJsonParse<T = unknown>(json: string): Result<T>;
/**
 * reviver를 지원하는 JSON 파싱
 */
export declare function safeJsonParseWithReviver<T = unknown>(json: string, reviver: (key: string, value: unknown) => unknown): Result<T>;
/**
 * ISO 8601 문자열을 Date 객체로 변환하는 reviver
 */
export declare function dateReviver(_key: string, value: unknown): unknown;
/**
 * ISO 8601 날짜 문자열을 Date로 변환하면서 JSON 파싱
 */
export declare function safeJsonParseWithDates<T = unknown>(json: string): Result<T>;
/**
 * 기본값을 가진 JSON 파싱
 */
export declare function parseJsonWithFallback<T>(json: string, fallback: T, options?: JsonParsingOptions): T;
/**
 * 텍스트에서 JSON 패턴 추출
 * LLM 응답 등에서 JSON을 추출할 때 유용
 */
export declare function extractJsonFromText(text: string): unknown | null;
/**
 * JSON 배열 파싱 (LLM 키워드 추출 등에 특화)
 */
export declare function parseJsonArray(text: string, fallback?: string[]): string[];
/**
 * 타입 안전한 JSON 파싱 (제네릭 + 타입 가드)
 */
export declare function parseJsonTyped<T>(json: string, typeGuard: (value: unknown) => value is T, fallback: T): T;
/**
 * 기본 parseJson 함수 (기존 Core 호환)
 * @deprecated Use safeJsonParse or parseJsonWithFallback for better error handling
 */
export declare function parseJson<T>(json: string): T;
//# sourceMappingURL=parser.d.ts.map