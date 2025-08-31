"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeZone = safeZone;
exports.isPromise = isPromise;
function safeZone(fn, options) {
    const { logger, retries = 0, retryDelay = 0 } = options ?? {};
    const execute = (attempt = 0) => {
        try {
            const result = fn();
            if (isPromise(result)) {
                return result
                    .then((result) => ({
                    success: true,
                    result,
                }))
                    .catch((reason) => {
                    logger?.error?.(reason);
                    if (attempt < retries) {
                        if (retryDelay > 0) {
                            return new Promise((resolve) => {
                                setTimeout(() => {
                                    const retryResult = execute(attempt + 1);
                                    if (isPromise(retryResult)) {
                                        retryResult.then(resolve);
                                    }
                                    else {
                                        resolve(retryResult);
                                    }
                                }, retryDelay);
                            });
                        }
                        const retryResult = execute(attempt + 1);
                        return retryResult;
                    }
                    return {
                        success: false,
                        reason,
                    };
                });
            }
            return {
                success: true,
                result,
            };
        }
        catch (error) {
            logger?.error?.(error);
            if (attempt < retries) {
                if (retryDelay > 0) {
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            const retryResult = execute(attempt + 1);
                            if (isPromise(retryResult)) {
                                retryResult.then(resolve);
                            }
                            else {
                                resolve(retryResult);
                            }
                        }, retryDelay);
                    });
                }
                return execute(attempt + 1);
            }
            return {
                success: false,
                reason: error,
            };
        }
    };
    return execute();
}
function isPromise(value) {
    return value instanceof Promise;
}
//# sourceMappingURL=safeZone.js.map