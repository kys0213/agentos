import { RpcEndpoint } from '../rpc-endpoint';
import type { CloseFn, RpcTransport } from '../../../shared/rpc/transport';
import type { RpcFrame } from '../../../shared/rpc/rpc-frame';

class MockTransport implements RpcTransport {
  stream?<T = unknown>(channel: string, payload?: unknown): AsyncGenerator<T, void, unknown> {
    throw new Error('Method not implemented.');
  }
  on<T = unknown>(
    channel: string,
    handler: (payload: T) => void,
    onError?: (e: unknown) => void
  ): CloseFn {
    throw new Error('Method not implemented.');
  }
  public sent: RpcFrame[] = [];
  public onFrame: ((f: RpcFrame) => void) | null = null;
  start(cb: (f: RpcFrame) => void): void {
    this.onFrame = cb;
  }
  post(frame: RpcFrame): void {
    this.sent.push(frame);
  }
  stop(): void {
    /* no-op */
  }
  async request<TRes = unknown, TReq = unknown>(channel: string, payload?: TReq): Promise<TRes> {
    // not used directly in these tests
    throw new Error('not implemented');
  }
}

describe('RpcEndpoint', () => {
  test('request resolves on res frame', async () => {
    const tr = new MockTransport();
    const ep = new RpcEndpoint(tr, { timeoutMs: 1000 });
    ep.start();

    const p = ep.request<number>('math.add', { a: 1, b: 2 });
    const isReq = (f: RpcFrame): f is Extract<RpcFrame, { kind: 'req' }> => f.kind === 'req';
    const req = tr.sent.find(isReq)!;
    expect(req).toBeDefined();

    tr.onFrame?.({ kind: 'res', cid: req.cid, ok: true, result: 3 });

    await expect(p).resolves.toBe(3);
  });

  test('request rejects on err frame', async () => {
    const tr = new MockTransport();
    const ep = new RpcEndpoint(tr, { timeoutMs: 1000 });
    ep.start();

    const p = ep.request('boom', {});
    const isReq = (f: RpcFrame): f is Extract<RpcFrame, { kind: 'req' }> => f.kind === 'req';
    const req = tr.sent.find(isReq)!;

    tr.onFrame?.({ kind: 'err', cid: req.cid, ok: false, message: 'bad', code: 'INTERNAL' });

    await expect(p).rejects.toThrow('bad');
  });

  test('request times out when no response', async () => {
    vi.useFakeTimers();
    const tr = new MockTransport();
    const ep = new RpcEndpoint(tr, { timeoutMs: 20 });
    ep.start();
    const p = ep.request('slow', {});
    vi.advanceTimersByTime(25);
    await expect(p).rejects.toThrow(/RPC_TIMEOUT/);
    vi.useRealTimers();
  });

  test('stream yields nxt frames until end', async () => {
    const tr = new MockTransport();
    const ep = new RpcEndpoint(tr);
    ep.start();

    const gen = ep.stream<number>('tick');

    // Start the async generator to trigger subscription and request sending
    const it = gen[Symbol.asyncIterator]();
    const firstPromise = it.next();

    // Wait a bit for the async generator to set up subscription and send request
    await new Promise((resolve) => setTimeout(resolve, 0));

    const isReq = (f: RpcFrame): f is Extract<RpcFrame, { kind: 'req' }> => f.kind === 'req';
    const req = tr.sent.find(isReq)!;

    tr.onFrame?.({ kind: 'nxt', cid: req.cid, data: 1 });
    tr.onFrame?.({ kind: 'nxt', cid: req.cid, data: 2 });
    tr.onFrame?.({ kind: 'end', cid: req.cid });

    const out: number[] = [];
    const first = await firstPromise;
    if (!first.done) out.push(first.value);

    let next = await it.next();
    while (!next.done) {
      out.push(next.value);
      next = await it.next();
    }

    expect(out).toEqual([1, 2]);
  });

  test('stream sends can on early consumer cancel', async () => {
    const tr = new MockTransport();
    const ep = new RpcEndpoint(tr);
    ep.start();

    const gen = ep.stream<number>('tick');

    // consume one and break
    const it = gen[Symbol.asyncIterator]();
    const firstPromise = it.next();

    // Wait a bit for the async generator to set up subscription and send request
    await new Promise((resolve) => setTimeout(resolve, 0));

    const isReq = (f: RpcFrame): f is Extract<RpcFrame, { kind: 'req' }> => f.kind === 'req';
    const req = tr.sent.find(isReq)!;
    tr.onFrame?.({ kind: 'nxt', cid: req.cid, data: 1 });

    const first = await firstPromise;
    expect(first.value).toBe(1);
    await it.return?.();

    // endpoint should post a cancel frame
    const hasCancel = tr.sent.some(
      (f): f is Extract<RpcFrame, { kind: 'can' }> => f.kind === 'can' && f.cid === req.cid
    );
    expect(hasCancel).toBe(true);
  });

  test('stream does NOT send can on normal completion (end frame)', async () => {
    const tr = new MockTransport();
    const ep = new RpcEndpoint(tr);
    ep.start();

    const gen = ep.stream<number>('tick');

    // Start the async generator to trigger subscription and request sending
    const it = gen[Symbol.asyncIterator]();
    const firstPromise = it.next();

    // Wait a bit for the async generator to set up subscription and send request
    await new Promise((resolve) => setTimeout(resolve, 0));

    const isReq = (f: RpcFrame): f is Extract<RpcFrame, { kind: 'req' }> => f.kind === 'req';
    const req = tr.sent.find(isReq)!;
    const initialCancelCount = tr.sent.filter(
      (f): f is Extract<RpcFrame, { kind: 'can' }> => f.kind === 'can' && f.cid === req.cid
    ).length;

    // Send normal stream completion
    tr.onFrame?.({ kind: 'nxt', cid: req.cid, data: 1 });
    tr.onFrame?.({ kind: 'nxt', cid: req.cid, data: 2 });
    tr.onFrame?.({ kind: 'end', cid: req.cid });

    const out: number[] = [];
    const first = await firstPromise;
    if (!first.done) out.push(first.value);

    let next = await it.next();
    while (!next.done) {
      out.push(next.value);
      next = await it.next();
    }

    expect(out).toEqual([1, 2]);

    // No additional cancel frame should be sent after normal completion
    const finalCancelCount = tr.sent.filter(
      (f): f is Extract<RpcFrame, { kind: 'can' }> => f.kind === 'can' && f.cid === req.cid
    ).length;
    expect(finalCancelCount).toBe(initialCancelCount);
  });

  test('acts as server: register handler and respond', async () => {
    const tr = new MockTransport();
    const ep = new RpcEndpoint(tr);
    ep.start();

    ep.register('math.add', (p: { a?: number; b?: number }) => (p.a ?? 0) + (p.b ?? 0));

    tr.onFrame?.({ kind: 'req', cid: 'c9', method: 'math.add', payload: { a: 2, b: 5 } });

    const isRes = (f: RpcFrame): f is Extract<RpcFrame, { kind: 'res' }> => f.kind === 'res';
    const res = tr.sent.find(
      (f): f is Extract<RpcFrame, { kind: 'res' }> => isRes(f) && f.cid === 'c9'
    )!;
    expect(res).toBeDefined();
    expect(res.ok).toBe(true);
    expect(res.result).toBe(7);
  });
});
