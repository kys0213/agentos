"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNonEmptyArray = exports.isPositiveNumber = exports.isNonEmptyString = exports.isPlainObject = exports.isPrimitive = exports.isNullish = exports.isError = exports.isRegexp = exports.isDate = exports.isFunction = exports.isArray = exports.isObject = exports.isBigint = exports.isSymbol = exports.isNull = exports.isUndefined = exports.isBoolean = exports.isNumber = exports.isString = void 0;
exports.isOfType = isOfType;
exports.hasProperties = hasProperties;
exports.isArrayOf = isArrayOf;
const is_1 = __importDefault(require("is"));
/**
 * JavaScript 값 타입 검증 유틸리티
 *
 * @example
 * ```typescript
 * import { isString, isNumber, isArray } from '@agentos/lang/validation';
 *
 * isString('hello'); // true
 * isNumber(42); // true
 * isArray([1, 2, 3]); // true
 * ```
 */
// Primitive type guards
exports.isString = is_1.default.string;
exports.isNumber = is_1.default.number;
exports.isBoolean = is_1.default.boolean;
exports.isUndefined = is_1.default.undefined;
exports.isNull = is_1.default.null;
exports.isSymbol = is_1.default.symbol;
exports.isBigint = is_1.default.bigint;
// Object type guards
exports.isObject = is_1.default.object;
exports.isArray = is_1.default.array;
exports.isFunction = is_1.default.function;
exports.isDate = is_1.default.date;
exports.isRegexp = is_1.default.regexp;
// Error type guard - proper TypeScript type guard implementation
const isError = (value) => value instanceof Error;
exports.isError = isError;
// Combined type guards
const isNullish = (value) => is_1.default.null(value) || is_1.default.undefined(value);
exports.isNullish = isNullish;
const isPrimitive = (value) => is_1.default.string(value) ||
    is_1.default.number(value) ||
    is_1.default.boolean(value) ||
    is_1.default.null(value) ||
    is_1.default.undefined(value) ||
    is_1.default.symbol(value) ||
    is_1.default.bigint(value);
exports.isPrimitive = isPrimitive;
const isPlainObject = (value) => typeof value === 'object' &&
    value !== null &&
    Object.prototype.toString.call(value) === '[object Object]';
exports.isPlainObject = isPlainObject;
// Utility type guards
const isNonEmptyString = (value) => {
    return typeof value === 'string' && value.length > 0;
};
exports.isNonEmptyString = isNonEmptyString;
const isPositiveNumber = (value) => {
    return typeof value === 'number' && value > 0 && !Number.isNaN(value);
};
exports.isPositiveNumber = isPositiveNumber;
const isNonEmptyArray = (value) => {
    return Array.isArray(value) && value.length > 0;
};
exports.isNonEmptyArray = isNonEmptyArray;
/**
 * 값이 특정 타입인지 검증하는 제네릭 함수
 */
function isOfType(value, guard) {
    return guard(value);
}
/**
 * 객체가 특정 속성들을 가지고 있는지 검증
 */
function hasProperties(value, properties) {
    if (!(0, exports.isPlainObject)(value)) {
        return false;
    }
    return properties.every((prop) => typeof prop === 'string' && prop in value);
}
/**
 * 배열의 모든 요소가 특정 타입인지 검증
 */
function isArrayOf(value, guard) {
    return Array.isArray(value) && value.every(guard);
}
//# sourceMappingURL=types.js.map