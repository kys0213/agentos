import { outerPromise, createNotifier } from '../outerPromise';

describe('outerPromise', () => {
  it('should create a promise with external resolve', async () => {
    const { promise, resolve } = outerPromise<string>();

    // 비동기적으로 resolve 호출
    setTimeout(() => resolve('test value'), 10);

    const result = await promise;
    expect(result).toBe('test value');
  });

  it('should create a promise with external reject', async () => {
    const { promise, reject } = outerPromise<string>();

    // 비동기적으로 reject 호출
    setTimeout(() => reject(new Error('test error')), 10);

    await expect(promise).rejects.toThrow('test error');
  });

  it('should handle PromiseLike values in resolve', async () => {
    const { promise, resolve } = outerPromise<string>();

    const promiseLike = Promise.resolve('promised value');
    resolve(promiseLike);

    const result = await promise;
    expect(result).toBe('promised value');
  });

  it('should be type-safe with generics', async () => {
    const { promise, resolve } = outerPromise<number>();

    resolve(42);

    const result = await promise;
    expect(typeof result).toBe('number');
    expect(result).toBe(42);
  });

  it('should work with void type', async () => {
    const { promise, resolve } = outerPromise<void>();

    resolve();

    await expect(promise).resolves.toBeUndefined();
  });

  it('should work with default void type', async () => {
    const { promise, resolve } = outerPromise();

    resolve();

    await expect(promise).resolves.toBeUndefined();
  });
});

describe('createNotifier', () => {
  it('should notify single waiter', async () => {
    const notifier = createNotifier();

    const waitPromise = notifier.wait();
    notifier.notify();

    await expect(waitPromise).resolves.toBeUndefined();
  });

  it('should notify multiple waiters', async () => {
    const notifier = createNotifier();

    const waiter1 = notifier.wait();
    const waiter2 = notifier.wait();
    const waiter3 = notifier.wait();

    notifier.notify();

    await expect(Promise.all([waiter1, waiter2, waiter3])).resolves.toEqual([
      undefined,
      undefined,
      undefined,
    ]);
  });

  it('should create new promises after notify', async () => {
    const notifier = createNotifier();

    // 첫 번째 라운드
    const firstWaiter = notifier.wait();
    notifier.notify();
    await firstWaiter;

    // 두 번째 라운드
    const secondWaiter = notifier.wait();
    notifier.notify();
    await secondWaiter;

    expect(true).toBe(true); // 위에서 예외가 발생하지 않았다면 성공
  });

  it('should handle rapid notify calls', async () => {
    const notifier = createNotifier();

    const results: boolean[] = [];

    // 여러 waiter 설정
    const waiters = Array.from({ length: 5 }, (_, i) =>
      notifier.wait().then(() => {
        results[i] = true;
      })
    );

    // 즉시 notify
    notifier.notify();

    await Promise.all(waiters);

    expect(results).toEqual([true, true, true, true, true]);
  });

  it('should work with async workflows', async () => {
    const notifier = createNotifier();
    const values: number[] = [];

    // 백그라운드에서 값 처리
    const processor = async () => {
      for (let i = 0; i < 3; i++) {
        await notifier.wait();
        values.push(i);
      }
    };

    const processingPromise = processor();

    // 순차적으로 notify
    for (let i = 0; i < 3; i++) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      notifier.notify();
    }

    await processingPromise;

    expect(values).toEqual([0, 1, 2]);
  });
});
