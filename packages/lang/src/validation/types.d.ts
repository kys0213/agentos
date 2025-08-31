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
export declare const isString: any;
export declare const isNumber: any;
export declare const isBoolean: any;
export declare const isUndefined: any;
export declare const isNull: any;
export declare const isSymbol: any;
export declare const isBigint: any;
export declare const isObject: any;
export declare const isArray: any;
export declare const isFunction: any;
export declare const isDate: any;
export declare const isRegexp: any;
export declare const isError: (value: unknown) => value is Error;
export declare const isNullish: (value: unknown) => value is null | undefined;
export declare const isPrimitive: (value: unknown) => value is string | number | boolean | null | undefined | symbol | bigint;
export declare const isPlainObject: (value: unknown) => value is Record<string, unknown>;
export declare const isNonEmptyString: (value: unknown) => value is string;
export declare const isPositiveNumber: (value: unknown) => value is number;
export declare const isNonEmptyArray: (value: unknown) => value is unknown[];
/**
 * 값이 특정 타입인지 검증하는 제네릭 함수
 */
export declare function isOfType<T>(value: unknown, guard: (value: unknown) => value is T): value is T;
/**
 * 객체가 특정 속성들을 가지고 있는지 검증
 */
export declare function hasProperties<T extends Record<string, unknown>>(value: unknown, properties: (keyof T)[]): value is T;
/**
 * 배열의 모든 요소가 특정 타입인지 검증
 */
export declare function isArrayOf<T>(value: unknown, guard: (item: unknown) => item is T): value is T[];
//# sourceMappingURL=types.d.ts.map