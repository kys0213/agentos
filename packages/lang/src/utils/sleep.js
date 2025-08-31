"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = sleep;
/**
 * Sleep for a given number of milliseconds.
 * @param ms - The number of milliseconds to sleep.
 * @returns A promise that resolves when the sleep is complete.
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=sleep.js.map