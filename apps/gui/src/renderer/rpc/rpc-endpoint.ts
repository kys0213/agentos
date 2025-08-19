// rpc/engine.ts
import { RpcTransport } from '../../shared/rpc/transport';
import { Cid, RpcFrame, RpcMetadata } from '../../shared/rpc/rpc-frame';
import { isObservable, Observable } from 'rxjs';
import { isObject } from '@agentos/core';

export type RpcHandler = (payload: unknown, meta?: unknown) => unknown; // Promise | AsyncGenerator | Observable-like
export type RpcHandlers = Record<string, RpcHandler>;

export interface RpcClientOptions {
  timeoutMs?: number; // default 30s
  onLog?: (ev: RpcFrame) => void;
}

type RpcObserver = {
  resolve: (v: any) => void;
  reject: (e: any) => void;
  timer?: number | NodeJS.Timeout;
  // streaming
  next?: (v: any) => void;
  complete?: () => void;
  error?: (e: any) => void;
};

export class RpcEndpoint {
  private pending = new Map<Cid, RpcObserver>();
  private cancelListeners = new Set<(f: RpcFrame) => void>();
  private handlers: RpcHandlers = {};
  private seq = 0;

  constructor(
    private transport: RpcTransport,
    private opts: RpcClientOptions = {}
  ) {}

  start() {
    this.transport.start(this.onFrame);
  }
  stop() {
    if (this.transport.stop) {
      this.transport.stop();
    }
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
      this.pending.set(cid, { resolve, reject, timer });
      this.transport.post({ kind: 'req', cid, method, payload, meta });
    });
  }

  stream<T>(method: string, payload?: unknown, meta?: RpcMetadata): AsyncGenerator<T, void, unknown> {
    const cid = this.cid();
    const queue: T[] = [];
    let done = false;
    let err: unknown;

    // Register observer before posting request
    const wake = (() => {
      let notify: (() => void) | null = null;
      const p = new Promise<void>((resolve) => (notify = resolve));
      return { p, notify: () => notify?.() };
    })();

    this.pending.set(cid, {
      resolve: () => {},
      reject: (e) => {
        err = e;
        wake.notify();
      },
      next: (v) => {
        queue.push(v as T);
        wake.notify();
      },
      complete: () => {
        done = true;
        wake.notify();
      },
      error: (e) => {
        err = e;
        done = true;
        wake.notify();
      },
    });

    // Post request synchronously so callers can observe it immediately
    this.transport.post({ kind: 'req', cid, method, payload, meta });

    const self = this;
    async function* iterator(): AsyncGenerator<T, void, unknown> {
      try {
        while (!done) {
          if (queue.length) {
            yield queue.shift()!;
          } else {
            await Promise.race([wake.p, new Promise((r) => setTimeout(r, 8))]);
          }
          if (err) throw err;
        }
      } finally {
        if (!done) {
          self.transport.post({ kind: 'can', cid });
        }
        self.pending.delete(cid);
      }
    }
    return iterator();
  }

  cancel(cid: Cid) {
    this.transport.post({ kind: 'can', cid });
  }

  private onFrame = async (f: RpcFrame) => {
    this.opts.onLog?.(f);
    if (f.kind === 'req') {
      const fn = this.handlers[f.method];

      if (!fn)
        return this.transport.post({
          kind: 'err',
          cid: f.cid,
          ok: false,
          message: `NO_HANDLER ${f.method}`,
          code: 'NOT_FOUND',
        });

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
          const result = await out;
          this.transport.post({ kind: 'res', cid: f.cid, ok: true, result });
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

    if (!waiter) return;

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
  return isObject(o) && typeof (o as any)[Symbol.asyncIterator] === 'function';
}
function isObservableLike(o: unknown): o is Observable<unknown> {
  return isObservable(o) && o && typeof (o as any).subscribe === 'function';
}
