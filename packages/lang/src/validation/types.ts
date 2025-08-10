import is from 'is';

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
export const isString = is.string;
export const isNumber = is.number;
export const isBoolean = is.boolean;
export const isUndefined = is.undefined;
export const isNull = is.null;
export const isSymbol = is.symbol;
export const isBigint = is.bigint;

// Object type guards
export const isObject = is.object;
export const isArray = is.array;
export const isFunction = is.function;
export const isDate = is.date;
export const isRegexp = is.regexp;
export const isError = is.error;

// Combined type guards
export const isNullish = (value: unknown): value is null | undefined => 
  is.null(value) || is.undefined(value);

export const isPrimitive = (value: unknown): value is string | number | boolean | null | undefined | symbol | bigint =>
  is.string(value) || is.number(value) || is.boolean(value) || 
  is.null(value) || is.undefined(value) || is.symbol(value) || is.bigint(value);

export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && Object.prototype.toString.call(value) === '[object Object]';

// Utility type guards
export const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.length > 0;
};

export const isPositiveNumber = (value: unknown): value is number => {
  return typeof value === 'number' && value > 0 && !Number.isNaN(value);
};

export const isNonEmptyArray = (value: unknown): value is unknown[] => {
  return Array.isArray(value) && value.length > 0;
};

/**
 * 값이 특정 타입인지 검증하는 제네릭 함수
 */
export function isOfType<T>(value: unknown, guard: (value: unknown) => value is T): value is T {
  return guard(value);
}

/**
 * 객체가 특정 속성들을 가지고 있는지 검증
 */
export function hasProperties<T extends Record<string, unknown>>(
  value: unknown, 
  properties: (keyof T)[]
): value is T {
  if (!isPlainObject(value)) return false;
  return properties.every(prop => typeof prop === 'string' && prop in value);
}

/**
 * 배열의 모든 요소가 특정 타입인지 검증
 */
export function isArrayOf<T>(
  value: unknown, 
  guard: (item: unknown) => item is T
): value is T[] {
  return Array.isArray(value) && value.every(guard);
}