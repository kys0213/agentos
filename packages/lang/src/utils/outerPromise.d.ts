/**
 * Promise의 resolve/reject 함수에 외부에서 접근할 수 있는 구조를 제공합니다.
 *
 * @example
 * ```typescript
 * const { promise, resolve, reject } = outerPromise<string>();
 *
 * // 다른 곳에서 promise를 resolve
 * setTimeout(() => resolve("완료"), 1000);
 *
 * // promise 대기
 * const result = await promise; // "완료"
 * ```
 *
 * @example
 * ```typescript
 * // 재사용 가능한 notifier 패턴
 * const { promise, resolve: notify } = outerPromise<void>();
 *
 * // 이벤트 발생 시 알림
 * eventEmitter.on('update', notify);
 *
 * // 업데이트 대기
 * await promise;
 * ```
 */
export interface OuterPromise<T> {
    /** 외부에서 제어 가능한 Promise */
    promise: Promise<T>;
    /** Promise를 성공으로 완료하는 함수 */
    resolve: (value: T | PromiseLike<T>) => void;
    /** Promise를 실패로 완료하는 함수 */
    reject: (reason?: unknown) => void;
}
/**
 * Promise의 resolve/reject 함수에 외부에서 접근할 수 있는 구조를 생성합니다.
 *
 * @returns resolve/reject 함수와 함께 Promise를 반환
 */
export declare function outerPromise<T = void>(): OuterPromise<T>;
/**
 * 재사용 가능한 notifier를 생성합니다.
 * notify 호출 시마다 새로운 Promise가 생성되어 대기 중인 모든 리스너에게 알림을 보냅니다.
 *
 * @example
 * ```typescript
 * const notifier = createNotifier();
 *
 * // 여러 곳에서 대기
 * const waiter1 = notifier.wait();
 * const waiter2 = notifier.wait();
 *
 * // 모든 대기자에게 알림
 * notifier.notify();
 *
 * await Promise.all([waiter1, waiter2]); // 모두 완료
 * ```
 */
export interface Notifier {
    /** 다음 알림까지 대기하는 Promise를 반환 */
    wait(): Promise<void>;
    /** 대기 중인 모든 리스너에게 알림을 보내고 새로운 Promise 생성 */
    notify(): void;
}
/**
 * 재사용 가능한 notifier를 생성합니다.
 */
export declare function createNotifier(): Notifier;
//# sourceMappingURL=outerPromise.d.ts.map