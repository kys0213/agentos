"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.outerPromise = outerPromise;
exports.createNotifier = createNotifier;
/**
 * Promise의 resolve/reject 함수에 외부에서 접근할 수 있는 구조를 생성합니다.
 *
 * @returns resolve/reject 함수와 함께 Promise를 반환
 */
function outerPromise() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return {
        promise,
        resolve: resolve,
        reject: reject,
    };
}
/**
 * 재사용 가능한 notifier를 생성합니다.
 */
function createNotifier() {
    let currentPromise = outerPromise();
    return {
        wait: () => currentPromise.promise,
        notify: () => {
            const prev = currentPromise;
            currentPromise = outerPromise();
            prev.resolve();
        },
    };
}
//# sourceMappingURL=outerPromise.js.map