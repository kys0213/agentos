import {
  filter,
  first,
  firstValueFrom,
  from,
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
import { toAsyncIterable } from './toAsyncIterator';

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
    private options: RpcClientOptions = {}
  ) {
    // Transport 프레임을 Subject로 전달
    this.transport.start((frame) => {
      this.options.onLog?.(frame);
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

    const stream$ = from(this.$inboundFrames).pipe(filter((f) => f.cid === cid));

    // 1. 먼저 구독 설정
    const subscription = stream$
      .pipe(filter((f) => f.kind === 'nxt' || f.kind === 'end' || f.kind === 'err'))
      .subscribe({
        next: (frame) => {
          if (frame.kind === 'nxt') {
            handler(frame.data as T);
          } else if (frame.kind === 'end') {
          } else if (frame.kind === 'err') {
            onError?.(new Error(frame.message));
          }
        },
        error: (e) => onError?.(e),
        complete: () => {},
      });

    // 2. 구독 완료 후 요청 전송
    this.transport.post({
      kind: 'req',
      cid,
      method: channel,
    });

    const close = async () => {
      subscription.unsubscribe();
      this.transport.post({
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
    timeoutMs = this.options.timeoutMs ?? 30000
  ): Promise<T> {
    const cid = this.generateId();

    const stream$ = this.createInboundFramesStream({ cid, timeoutMs });

    // 1. 먼저 응답 구독 설정
    const response$ = stream$.pipe(
      filter((f) => f.kind === 'res' || f.kind === 'err'),
      first()
    );

    // 2. 구독 완료 후 요청 전송
    this.transport.post({ kind: 'req', cid, method, payload, meta });

    const frame = await firstValueFrom(response$);

    if (frame.kind === 'err') {
      throw new Error(frame.message);
    }

    if (frame.kind !== 'res') {
      throw new Error('Unexpected frame kind');
    }

    return frame.result as T;
  }

  async *stream<T>(
    method: string,
    payload?: unknown,
    meta?: RpcMetadata
  ): AsyncGenerator<T, void, unknown> {
    const cid = this.generateId();

    const stream$ = from(this.$inboundFrames).pipe(filter((f) => f.cid === cid));

    // 2. 구독 완료 후 요청 전송
    this.transport.post({ kind: 'req', cid, method, payload, meta });

    let normallyCompleted = false;

    try {
      for await (const frame of toAsyncIterable(stream$)) {
        if (frame.kind === 'nxt') {
          yield frame.data as T;
        } else if (frame.kind === 'end') {
          normallyCompleted = true;
          break;
        } else if (frame.kind === 'err') {
          normallyCompleted = true; // 에러도 정상적인 완료로 간주 (서버에서 이미 스트림 종료함)
          throw new Error(frame.message);
        }
      }
    } finally {
      // 정상적으로 완료되지 않은 경우에만 취소 신호 전송 (조기 종료, 예외 등)
      if (!normallyCompleted) {
        this.transport.post({ kind: 'can', cid });
      }
    }
  }

  cancel(cid: Cid) {
    this.transport.post({ kind: 'can', cid });
  }

  private async handleRequest(f: RpcFrame) {
    if (f.kind !== 'req') {
      return; // 타입 가드
    }

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
        // Cancel 스트림 생성
        const cancel$ = this.$inboundFrames.pipe(
          filter((cf) => cf.kind === 'can' && cf.cid === f.cid)
        );

        out
          .pipe(takeUntil(cancel$)) // cancel 신호가 오면 자동 완료
          .subscribe({
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
  }

  private createTimer(timeoutMs: number, cid: string) {
    return timer(timeoutMs).pipe(
      map(
        (): RpcFrame => ({
          kind: 'err',
          message: `RPC_TIMEOUT`,
          cid,
          ok: false,
          code: 'TIMEOUT',
        })
      )
    );
  }

  private generateId(): Cid {
    return `${Date.now()}-${++this.seq}-${Math.random().toString(16).slice(2)}`;
  }

  private createInboundFramesStream(options: {
    cid?: string;
    timeoutMs?: number;
  }): Observable<RpcFrame> {
    const { cid = this.generateId(), timeoutMs } = options;

    const stream$ = from(this.$inboundFrames).pipe(filter((f) => f.cid === cid));

    if (!timeoutMs) {
      return stream$;
    }

    const timer$ = this.createTimer(timeoutMs, cid);

    return race(stream$, timer$);
  }
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

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
