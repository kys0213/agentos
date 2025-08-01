export declare function safeZone<T>(fn: () => T | Promise<T>): Promise<Result<T>> | Result<T>;
export declare function isPromise<T>(value: T | Promise<T>): value is Promise<T>;
type SuccessResult<T> = {
    success: true;
    result: T;
};
type ErrorResult = {
    success: false;
    reason: unknown;
};
type Result<T> = SuccessResult<T> | ErrorResult;
export {};
//# sourceMappingURL=safeZone.d.ts.map