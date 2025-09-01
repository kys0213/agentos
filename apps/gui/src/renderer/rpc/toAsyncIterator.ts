import { Observable } from 'rxjs';

/**
 * Observable을 AsyncIterable로 변환하는 유틸리티
 * @param source - 변환할 Observable
 * @returns AsyncIterable<T>
 */
export function toAsyncIterable<T>(source: Observable<T>): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator](): AsyncIterator<T> {
      const values: T[] = [];
      let done = false;
      let err: unknown = null;
      let wake: (() => void) | null = null;
      let subscribed = false;

      const sub = source.subscribe({
        next: (v) => {
          values.push(v);
          wake?.();
        },
        error: (e) => {
          err = e;
          done = true;
          wake?.();
        },
        complete: () => {
          done = true;
          wake?.();
        },
      });

      subscribed = true;

      return {
        async next(): Promise<IteratorResult<T>> {
          // eslint-disable-next-line no-constant-condition
          while (true) {
            if (values.length > 0) {
              return { value: values.shift()!, done: false };
            }

            if (err) {
              throw err instanceof Error ? err : new Error(String(err));
            }

            if (done) {
              return { value: undefined, done: true };
            }

            // 다음 값이나 완료를 기다림
            await new Promise<void>((resolve) => {
              wake = resolve;
            });
            wake = null;
          }
        },

        async return(): Promise<IteratorResult<T>> {
          if (subscribed) {
            sub.unsubscribe();
            subscribed = false;
          }
          return { value: undefined, done: true };
        },

        async throw(e: unknown): Promise<IteratorResult<T>> {
          if (subscribed) {
            sub.unsubscribe();
            subscribed = false;
          }
          throw e;
        },
      };
    },
  };
}
