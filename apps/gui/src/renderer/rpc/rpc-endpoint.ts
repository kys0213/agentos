import {
  filter,
  first,
  firstValueFrom,
  isObservable,
  map,
  Observable,
  race,
  Subject,
  takeUntil,
  timer,
} from 'rxjs';
import { Cid, RpcFrame, RpcMetadata } from '../../shared/rpc/rpc-frame';
import type { CloseFn, FrameTransport, RpcClient } from '../../shared/rpc/transport';

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

export type RpcHandler = (payload: unknown, meta?: unknown) => unknown; // Promise | AsyncGenerator | Observable-like
export type RpcHandlers = Record<string, RpcHandler>;

export interface RpcClientOptions {
  timeoutMs?: number; // default 30s
  onLog?: (ev: RpcFrame) => void;
}

export class RpcEndpoint implements RpcClient {
  private readonly $inboundFrames = new Subject<RpcFrame>();
  private readonly $outboundChannel = new Subject<RpcFrame>();

  private handlers: RpcHandlers = {};
  private seq = 0;
  private started = false;

  constructor(
    private transport: FrameTransport,
    private opts: RpcClientOptions = {}
  ) {
    // Transport 프레임을 Subject로 전달
    this.transport.start((frame) => {
      this.opts.onLog?.(frame);
      this.$inboundFrames.next(frame);
    });

    // Outbound 채널 구독
    this.$outboundChannel.subscribe({
      next: (f) => this.transport.post(f),
    });
  }

  on<T = unknown>(
    channel: string,
    handler: (payload: T) => void,
    onError?: (e: unknown) => void
  ): CloseFn {
    const cid = this.generateId();

    // 1. 먼저 구독 설정
    const subscription = this.$inboundFrames
      .pipe(
        filter((f) => f.cid === cid && (f.kind === 'nxt' || f.kind === 'end' || f.kind === 'err'))
      )
      .subscribe({
        next: (frame) => {
          if (frame.kind === 'nxt') {
            handler(frame.data as T);
          } else if (frame.kind === 'end') {
            // Stream completed naturally
          } else if (frame.kind === 'err') {
            onError?.(new Error(frame.message));
          }
        },
        error: (e) => onError?.(e),
        complete: () => {
          // Observable completed
        },
      });

    // 2. 구독 완료 후 요청 전송
    this.post({
      kind: 'req',
      cid,
      method: channel,
    });

    const close = async () => {
      subscription.unsubscribe();
      this.post({
        kind: 'can',
        cid,
      });
    };

    return close;
  }

  start(onFrame?: (f: RpcFrame) => void) {
    if (this.started) {
      return;
    }
    this.started = true;

    if (onFrame) {
      // FrameTransport 인터페이스 구현 - 외부 콜백 등록
      this.$inboundFrames.subscribe(onFrame);
    } else {
      // 내부 서버 기능 시작 (request 핸들러)
      this.$inboundFrames
        .pipe(filter((f) => f.kind === 'req'))
        .subscribe((frame) => this.handleRequest(frame));
    }
  }

  stop() {
    this.$outboundChannel.complete();
    this.clear();
  }

  clear() {
    this.handlers = {};
    this.seq = 0;
  }

  // FrameTransport 인터페이스 구현
  post(frame: RpcFrame) {
    this.$outboundChannel.next(frame);
  }

  register(method: string, fn: RpcHandler) {
    if (this.handlers[method]) {
      throw new Error(`Method ${method} already registered`);
    }

    this.handlers[method] = fn;
  }

  async request<T = unknown>(
    method: string,
    payload?: unknown,
    meta?: RpcMetadata,
    timeoutMs = this.opts.timeoutMs ?? 30000
  ): Promise<T> {
    const cid = this.generateId();

    // 1. 먼저 응답 구독 설정
    const response$ = this.$inboundFrames.pipe(
      filter((f) => f.cid === cid && (f.kind === 'res' || f.kind === 'err')),
      first()
    );

    const timeout$ = this.createTimer(timeoutMs, method, cid);

    // 2. 구독 완료 후 요청 전송
    this.post({ kind: 'req', cid, method, payload, meta });

    const frame = await firstValueFrom(race(response$, timeout$));

    if (frame.kind === 'err') {
      throw new Error(frame.message);
    }

    if (frame.kind !== 'res') {
      throw new Error('Unexpected frame kind');
    }

    return frame.result as T;
  }

  private createTimer(timeoutMs: number, method: string, cid: string) {
    return timer(timeoutMs).pipe(
      map(
        (): RpcFrame => ({
          kind: 'err',
          message: `RPC_TIMEOUT ${method}`,
          cid,
          ok: false,
          code: 'TIMEOUT',
        })
      )
    );
  }

  stream<T>(
    method: string,
    payload?: unknown,
    meta?: RpcMetadata
  ): AsyncGenerator<T, void, unknown> {
    const cid = this.generateId();

    return this.createStreamGenerator<T>(cid, { method, payload, meta });
  }

  private async *createStreamGenerator<T>(
    cid: Cid, 
    requestData: { method: string; payload?: unknown; meta?: RpcMetadata }
  ): AsyncGenerator<T, void, unknown> {
    const values: T[] = [];
    let completed = false;
    let error: unknown = null;
    let pendingResolve: (() => void) | null = null;

    // 1. 먼저 해당 CID의 스트림 데이터 구독 설정
    const subscription = this.$inboundFrames
      .pipe(
        filter((f) => f.cid === cid && (f.kind === 'nxt' || f.kind === 'end' || f.kind === 'err'))
      )
      .subscribe({
        next: (frame) => {
          if (frame.kind === 'nxt') {
            values.push(frame.data as T);
          } else if (frame.kind === 'end') {
            completed = true;
          } else if (frame.kind === 'err') {
            error = new Error(frame.message);
            completed = true;
          }

          if (pendingResolve) {
            const resolve = pendingResolve;
            pendingResolve = null;
            resolve();
          }
        },
        error: (err) => {
          error = err;
          completed = true;
          if (pendingResolve) {
            const resolve = pendingResolve;
            pendingResolve = null;
            resolve();
          }
        },
      });

    // 2. 구독 완료 후 요청 전송
    this.post({ 
      kind: 'req', 
      cid, 
      method: requestData.method, 
      payload: requestData.payload, 
      meta: requestData.meta 
    });

    try {
      while (!completed || values.length > 0) {
        if (values.length > 0) {
          yield values.shift()!;
        } else if (!completed) {
          await new Promise<void>((resolve) => {
            pendingResolve = resolve;
          });
        }

        if (error) {
          throw error;
        }
      }
    } finally {
      subscription.unsubscribe();
      if (!completed) {
        this.post({ kind: 'can', cid });
      }
    }
  }

  cancel(cid: Cid) {
    this.post({ kind: 'can', cid });
  }

  private async handleRequest(f: RpcFrame) {
    if (f.kind !== 'req') {
      return; // 타입 가드
    }

    const fn = this.handlers[f.method];

    if (!fn) {
      this.post({
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
          this.post({ kind: 'nxt', cid: f.cid, data: chunk });
        }
        this.post({ kind: 'end', cid: f.cid });
      } else if (isObservableLike(out)) {
        // Cancel 스트림 생성
        const cancel$ = this.$inboundFrames.pipe(
          filter((cf) => cf.kind === 'can' && cf.cid === f.cid)
        );

        out
          .pipe(takeUntil(cancel$)) // cancel 신호가 오면 자동 완료
          .subscribe({
            next: (v) => this.post({ kind: 'nxt', cid: f.cid, data: v }),
            error: (e) =>
              this.post({
                kind: 'err',
                cid: f.cid,
                ok: false,
                message: e instanceof Error ? e.message : String(e),
                code: 'OPERATION_FAILED',
              }),
            complete: () => this.post({ kind: 'end', cid: f.cid }),
          });
      } else {
        if (isPromiseLike(out)) {
          const result = await out;
          this.post({ kind: 'res', cid: f.cid, ok: true, result });
        } else {
          this.post({ kind: 'res', cid: f.cid, ok: true, result: out });
        }
      }
    } catch (e: unknown) {
      this.post({
        kind: 'err',
        cid: f.cid,
        ok: false,
        message: String(e),
        code: 'INTERNAL',
      });
    }
  }

  private generateId(): Cid {
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
