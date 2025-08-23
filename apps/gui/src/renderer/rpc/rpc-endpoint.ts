// rpc/engine.ts
import type { CloseFn, FrameTransport, RpcClient } from '../../shared/rpc/transport';
import { Cid, RpcFrame, RpcMetadata } from '../../shared/rpc/rpc-frame';
import { isObservable, Observable } from 'rxjs';
import { createNotifier, type Notifier } from './notifier';

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

export type RpcHandler = (payload: unknown, meta?: unknown) => unknown; // Promise | AsyncGenerator | Observable-like
export type RpcHandlers = Record<string, RpcHandler>;

export interface RpcClientOptions {
  timeoutMs?: number; // default 30s
  onLog?: (ev: RpcFrame) => void;
}

type RpcObserver = {
  resolve: (v: unknown) => void;
  reject: (e: unknown) => void;
  timer?: number | NodeJS.Timeout;
  // streaming
  next?: (v: unknown) => void;
  complete?: () => void;
  error?: (e: unknown) => void;
};

type StreamContext<T> = {
  queue: T[];
  done: boolean;
  err: unknown;
  wake: Notifier;
  cid: Cid;
};

export class RpcEndpoint implements RpcClient {
  private pending = new Map<Cid, RpcObserver>();
  private cancelListeners = new Set<(f: RpcFrame) => void>();
  private handlers: RpcHandlers = {};
  private seq = 0;

  constructor(
    private transport: FrameTransport,
    private opts: RpcClientOptions = {}
  ) {}

  on<T = unknown>(
    channel: string,
    handler: (payload: T) => void,
    onError?: (e: unknown) => void
  ): CloseFn {
    const context: StreamContext<T> = {
      queue: [],
      done: false,
      err: null,
      wake: createNotifier(),
      cid: this.cid(),
    };

    const observer: RpcObserver = {
      resolve: () => {},
      reject: (e) => {
        context.err = e;
        context.wake.notify();
      },
      next: (v) => {
        context.queue.push(v as T);
        context.wake.notify();
      },
      complete: () => {
        context.done = true;
        context.wake.notify();
      },
      error: (e) => {
        context.err = e;
        context.done = true;
        context.wake.notify();
      },
    };

    this.pending.set(context.cid, observer);

    // Post request synchronously so callers can observe it immediately
    this.transport.post({
      kind: 'req',
      cid: context.cid,
      method: channel,
    });

    const generator = this.iterator(context);

    const close = async () => {
      this.transport.post({
        kind: 'can',
        cid: context.cid,
      });
    };

    (async () => {
      try {
        for await (const payload of generator) {
          if (context.done) {
            break;
          }
          handler(payload);
        }
      } catch (e) {
        onError?.(e);
      }
    })();

    return close;
  }

  start() {
    this.transport.start(this.onFrame);
  }
  stop() {
    this.transport.stop?.();
    this.clear();
  }

  clear() {
    this.pending.clear();
    this.handlers = {};
    this.seq = 0;
  }

  register(method: string, fn: RpcHandler) {
    this.handlers[method] = fn;
  }

  request<T = unknown>(
    method: string,
    payload?: unknown,
    meta?: RpcMetadata,
    timeoutMs = this.opts.timeoutMs ?? 30000
  ): Promise<T> {
    const cid = this.cid();

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(cid);
        reject(new Error(`RPC_TIMEOUT ${method}`));
      }, timeoutMs);

      this.pending.set(cid, {
        resolve: (v: unknown) => resolve(v as T),
        reject,
        timer,
      });
      this.transport.post({ kind: 'req', cid, method, payload, meta });
    });
  }

  stream<T>(
    method: string,
    payload?: unknown,
    meta?: RpcMetadata
  ): AsyncGenerator<T, void, unknown> {
    const context: StreamContext<T> = {
      queue: [],
      done: false,
      err: null,
      wake: createNotifier(),
      cid: this.cid(),
    };

    this.pending.set(context.cid, {
      resolve: () => {},
      reject: (e) => {
        context.err = e;
        context.wake.notify();
      },
      next: (v) => {
        context.queue.push(v as T);
        context.wake.notify();
      },
      complete: () => {
        context.done = true;
        context.wake.notify();
      },
      error: (e) => {
        context.err = e;
        context.done = true;
        context.wake.notify();
      },
    });

    // Post request synchronously so callers can observe it immediately
    this.transport.post({ kind: 'req', cid: context.cid, method, payload, meta });

    return this.iterator(context);
  }

  private async *iterator<T>(context: StreamContext<T>): AsyncGenerator<T, void, unknown> {
    try {
      while (!context.done || context.queue.length) {
        if (context.queue.length) {
          yield context.queue.shift()!;
        } else {
          await context.wake.wait();
        }
        if (context.err) {
          throw context.err;
        }
      }
    } finally {
      if (!context.done) {
        this.transport.post({ kind: 'can', cid: context.cid });
      }
      this.pending.delete(context.cid);
    }
  }

  cancel(cid: Cid) {
    this.transport.post({ kind: 'can', cid });
  }

  private onFrame = async (f: RpcFrame) => {
    this.opts.onLog?.(f);

    if (f.kind === 'req') {
      const fn = this.handlers[f.method];

      if (!fn) {
        this.transport.post({
          kind: 'err',
          cid: f.cid,
          ok: false,
          message: `NO_HANDLER ${f.method}`,
          code: 'NOT_FOUND',
        });
        return;
      }

      try {
        const out = fn(f.payload, f.meta);

        if (isAsyncGen(out)) {
          for await (const chunk of out) {
            this.transport.post({ kind: 'nxt', cid: f.cid, data: chunk });
          }
          this.transport.post({ kind: 'end', cid: f.cid });
        } else if (isObservableLike(out)) {
          const sub = out.subscribe({
            next: (v) => this.transport.post({ kind: 'nxt', cid: f.cid, data: v }),
            error: (e) =>
              this.transport.post({
                kind: 'err',
                cid: f.cid,
                ok: false,
                message: e instanceof Error ? e.message : String(e),
                code: 'OPERATION_FAILED',
              }),
            complete: () => this.transport.post({ kind: 'end', cid: f.cid }),
          });

          const cancel = (cf: RpcFrame) => {
            if (cf.kind === 'can' && cf.cid === f.cid) {
              sub.unsubscribe?.();
              this.offCancel(cancel);
              this.transport.post({ kind: 'end', cid: f.cid });
            }
          };

          this.onCancel(cancel);
        } else {
          if (isPromiseLike(out)) {
            const result = await out;
            this.transport.post({ kind: 'res', cid: f.cid, ok: true, result });
          } else {
            this.transport.post({ kind: 'res', cid: f.cid, ok: true, result: out });
          }
        }
      } catch (e: unknown) {
        this.transport.post({
          kind: 'err',
          cid: f.cid,
          ok: false,
          message: String(e),
          code: 'INTERNAL',
        });
      }
      return;
    }

    const waiter = this.pending.get(f.cid);

    if (!waiter) {
      return;
    }

    if (f.kind === 'res') {
      clearTimeout(waiter.timer);
      this.pending.delete(f.cid);
      waiter.resolve(f.result);
    } else if (f.kind === 'err') {
      clearTimeout(waiter.timer);
      this.pending.delete(f.cid);
      waiter.reject(new Error(f.message));
      waiter.error?.(new Error(f.message));
    } else if (f.kind === 'nxt') {
      waiter.next?.(f.data);
    } else if (f.kind === 'end') {
      this.pending.delete(f.cid);
      waiter.complete?.();
    }
  };

  private onCancel(cb: (f: RpcFrame) => void) {
    this.cancelListeners.add(cb);
  }

  private offCancel(cb: (f: RpcFrame) => void) {
    this.cancelListeners.delete(cb);
  }

  private cid(): Cid {
    return `${Date.now()}-${++this.seq}-${Math.random().toString(16).slice(2)}`;
  }
}

function isAsyncGen(o: unknown): o is AsyncGenerator<unknown, void, unknown> {
  if (!isObject(o)) {
    return false;
  }
  const iterator = (o as { [Symbol.asyncIterator]?: unknown })[Symbol.asyncIterator];
  return typeof iterator === 'function';
}
function isObservableLike(o: unknown): o is Observable<unknown> {
  return (
    isObservable(o) && isObject(o) && typeof (o as { subscribe?: unknown }).subscribe === 'function'
  );
}
function isPromiseLike(o: unknown): o is PromiseLike<unknown> {
  const isObjOrFn = (typeof o === 'object' && o !== null) || typeof o === 'function';
  return isObjOrFn && typeof (o as { then?: unknown }).then === 'function';
}
