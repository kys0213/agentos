export interface SafeZoneOptions {
    logger?: {
        error?: (error: unknown) => void;
    };
    retries?: number;
    retryDelay?: number;
}
type SuccessResult<T> = {
    success: true;
    result: T;
};
type ErrorResult = {
    success: false;
    reason: unknown;
};
export type Result<T> = SuccessResult<T> | ErrorResult;
export declare function safeZone<T>(fn: () => T | Promise<T>, options?: SafeZoneOptions): Promise<Result<T>> | Result<T>;
export declare function isPromise<T>(value: T | Promise<T>): value is Promise<T>;
export {};
//# sourceMappingURL=safeZone.d.ts.map