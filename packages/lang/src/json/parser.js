"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeJsonParse = safeJsonParse;
exports.safeJsonParseWithReviver = safeJsonParseWithReviver;
exports.dateReviver = dateReviver;
exports.safeJsonParseWithDates = safeJsonParseWithDates;
exports.parseJsonWithFallback = parseJsonWithFallback;
exports.extractJsonFromText = extractJsonFromText;
exports.parseJsonArray = parseJsonArray;
exports.parseJsonTyped = parseJsonTyped;
exports.parseJson = parseJson;
/**
 * 안전한 JSON 파싱 (Result 타입 반환)
 */
function safeJsonParse(json) {
    try {
        const parsed = JSON.parse(json);
        return {
            success: true,
            result: parsed,
        };
    }
    catch (error) {
        return {
            success: false,
            reason: error,
        };
    }
}
/**
 * reviver를 지원하는 JSON 파싱
 */
function safeJsonParseWithReviver(json, reviver) {
    try {
        const parsed = JSON.parse(json, reviver);
        return {
            success: true,
            result: parsed,
        };
    }
    catch (error) {
        return {
            success: false,
            reason: error,
        };
    }
}
const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
/**
 * ISO 8601 문자열을 Date 객체로 변환하는 reviver
 */
function dateReviver(_key, value) {
    if (typeof value === 'string' && ISO_8601_REGEX.test(value)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }
    return value;
}
/**
 * ISO 8601 날짜 문자열을 Date로 변환하면서 JSON 파싱
 */
function safeJsonParseWithDates(json) {
    return safeJsonParseWithReviver(json, dateReviver);
}
/**
 * 기본값을 가진 JSON 파싱
 */
function parseJsonWithFallback(json, fallback, options) {
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
        return parsed;
    }
    catch {
        return fallback;
    }
}
/**
 * 텍스트에서 JSON 패턴 추출
 * LLM 응답 등에서 JSON을 추출할 때 유용
 */
function extractJsonFromText(text) {
    if (!text || typeof text !== 'string') {
        return null;
    }
    const trimmed = text.trim();
    // 직접적인 JSON 구조인 경우
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
            return JSON.parse(trimmed);
        }
        catch {
            // fall through to pattern matching
        }
    }
    // JSON 배열 패턴 매칭 (가장 일반적)
    const arrayMatch = trimmed.match(/\[[\s\S]*?\]/);
    if (arrayMatch) {
        try {
            const parsed = JSON.parse(arrayMatch[0]);
            return Array.isArray(parsed) ? parsed : null;
        }
        catch {
            // ignore
        }
    }
    // JSON 객체 패턴 매칭
    const objectMatch = trimmed.match(/\{[\s\S]*?\}/);
    if (objectMatch) {
        try {
            const parsed = JSON.parse(objectMatch[0]);
            return typeof parsed === 'object' && parsed !== null ? parsed : null;
        }
        catch {
            // ignore
        }
    }
    return null;
}
/**
 * JSON 배열 파싱 (LLM 키워드 추출 등에 특화)
 */
function parseJsonArray(text, fallback = []) {
    const result = parseJsonWithFallback(text, fallback, {
        validator: (value) => Array.isArray(value),
        extractPattern: true,
    });
    // 배열이 아니거나 문자열이 아닌 요소가 있으면 필터링
    if (Array.isArray(result)) {
        return result.filter((item) => typeof item === 'string');
    }
    return fallback;
}
/**
 * 타입 안전한 JSON 파싱 (제네릭 + 타입 가드)
 */
function parseJsonTyped(json, typeGuard, fallback) {
    return parseJsonWithFallback(json, fallback, { validator: typeGuard });
}
/**
 * 기본 parseJson 함수 (기존 Core 호환)
 * @deprecated Use safeJsonParse or parseJsonWithFallback for better error handling
 */
function parseJson(json) {
    return JSON.parse(json);
}
//# sourceMappingURL=parser.js.map