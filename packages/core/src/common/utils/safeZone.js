"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeZone = safeZone;
exports.isPromise = isPromise;
function safeZone(fn) {
    try {
        const result = fn();
        if (isPromise(result)) {
            return result
                .then((result) => ({
                success: true,
                result,
            }))
                .catch((reason) => ({
                success: false,
                reason,
            }));
        }
        return {
            success: true,
            result,
        };
    }
    catch (error) {
        return {
            success: false,
            reason: error,
        };
    }
}
function isPromise(value) {
    return value instanceof Promise;
}
//# sourceMappingURL=safeZone.js.map