import { CoreError, isObject } from '@agentos/core';
import { CustomTransportStrategy, Server } from '@nestjs/microservices';
import { BrowserWindow, IpcMain } from 'electron';
import { isObservable, Observable, Subscription } from 'rxjs';
import { Cid, RpcFrame, RpcMetadata } from '../../../shared/rpc/rpc-frame';

/**
 * Prototype: frame-based transport to support req/res/err/nxt/end/can
 * Not wired yet; safe to keep for later migration.
 */
export class ElectronEventTransport extends Server implements CustomTransportStrategy {
  transportId = Symbol('ElectronTransport');

  private onIncomingFrame: (frame: RpcFrame, senderId: number) => void;

  private readonly subscriptions = new Map<string, Subscription>();

  private readonly localHandlers = new Map<
    string,
    ((
      payload: unknown,
      ctx: { senderId: number }
    ) =>
      | unknown
      | AsyncGenerator<unknown, unknown, unknown>
      | import('rxjs').Observable<unknown>) & { extras?: { broadcast?: boolean } }
  >();

  constructor(private readonly ipcMain: IpcMain) {
    super();
    this.onIncomingFrame = this.createIncomingFrameHandler();
  }

  /**
   * Register an RPC handler for a method. Exposed to support test wiring
   * without accessing internal Server state.
   */
  public registerHandler(
    method: string,
    handler: (
      payload: unknown,
      ctx: { senderId: number }
    ) => unknown | AsyncGenerator<unknown, unknown, unknown> | import('rxjs').Observable<unknown>,
    extras?: { broadcast?: boolean }
  ): void {
    const withExtras = Object.assign(handler, { extras });
    this.localHandlers.set(method, withExtras);
  }

  listen(cb: () => void) {
    this.ipcMain.on('bridge:post', (e, frame) => {
      // 이 이벤트를 Nest Transport로 넘김
      this.onIncomingFrame(frame, e.sender.id);
    });

    cb();
  }

  close() {}

  // eslint-disable-next-line @typescript-eslint/ban-types
  on() {
    throw new Error('Method not implemented.');
  }
  unwrap<T>(): T {
    throw new Error('Method not implemented.');
  }

  private createIncomingFrameHandler() {
    return async (frame: RpcFrame, senderId: number) => {
      try {
        if (frame?.kind === 'can') {
          const sub = this.subscriptions.get(frame.cid);
          sub?.unsubscribe();
          this.subscriptions.delete(frame.cid);
          return;
        }

        if (frame?.kind !== 'req') {
          return;
        }

        const handler =
          this.localHandlers.get(frame.method) ?? this.messageHandlers.get(frame.method);

        if (!handler) {
          return this.sendTo(senderId, {
            kind: 'err',
            cid: frame.cid,
            ok: false,
            message: 'NO_HANDLER',
            code: 'NOT_FOUND',
          });
        }

        const { broadcast } = handler.extras ?? {};

        const out = await handler(frame.payload, { senderId });

        const send = broadcast
          ? (frame: RpcFrame) => this.sendToAll(frame)
          : (frame: RpcFrame) => this.sendTo(senderId, frame);

        if (isObservable(out)) {
          this.handleByObservable(out, frame, send);
          return;
        } else if (isAsyncIterable(out)) {
          for await (const chunk of out) {
            send({ kind: 'nxt', cid: frame.cid, data: chunk, method: frame.method });
          }

          return send({ kind: 'end', cid: frame.cid });
        }

        return send({ kind: 'res', cid: frame.cid, ok: true, result: out });
      } catch (e: unknown) {
        if (e instanceof CoreError) {
          return this.sendTo(senderId, {
            kind: 'err',
            cid: frame.cid,
            ok: false,
            message: e.message,
            code: e.code,
            details: e.details,
          });
        } else if (isObject(e) && 'code' in e) {
          const anyErr = e as { message?: string; code?: string; details?: unknown };
          return this.sendTo(senderId, {
            kind: 'err',
            cid: frame.cid,
            ok: false,
            message: String(anyErr.message ?? '[error]'),
            code: anyErr.code ?? 'INTERNAL',
            details: isObject(anyErr.details) ? anyErr.details : undefined,
          });
        } else if (e instanceof Error) {
          return this.sendTo(senderId, {
            kind: 'err',
            cid: frame.cid,
            ok: false,
            message: e.message,
            code: 'INTERNAL',
            details: undefined,
          });
        } else {
          return this.sendTo(senderId, {
            kind: 'err',
            cid: frame.cid,
            ok: false,
            message: String(e),
            code: 'INTERNAL',
            details: undefined,
          });
        }
      }
    };
  }

  private handleByObservable(
    out: Observable<unknown>,
    frame: { kind: 'req'; cid: Cid; method: string; payload?: unknown; meta?: RpcMetadata },
    send: (frame: RpcFrame) => void
  ) {
    const sub = out.subscribe({
      next: (v) => send({ kind: 'nxt', cid: frame.cid, data: v, method: frame.method }),
      error: (e) =>
        send({
          kind: 'err',
          cid: frame.cid,
          ok: false,
          message: getErrorMessage(e),
          code: getErrorCode(e) ?? 'OPERATION_FAILED',
        }),
      complete: () => {
        send({ kind: 'end', cid: frame.cid });
        this.subscriptions.delete(frame.cid);
      },
    });

    this.subscriptions.set(frame.cid, sub);
  }

  private sendToAll(frame: RpcFrame) {
    for (const w of BrowserWindow.getAllWindows()) {
      if (!w.isDestroyed()) {
        w.webContents.send('bridge:frame', frame);
      }
    }
  }

  // 외부(Transport)에서 호출하도록 export
  private sendTo(wcId: number, frame: RpcFrame) {
    const win = BrowserWindow.fromId(wcId);

    if (win && !win.isDestroyed()) {
      win.webContents.send('bridge:frame', frame);
    }
  }
}

// Type guard for async iterables
function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return (
    value != null &&
    typeof (value as { [Symbol.asyncIterator]?: unknown })[Symbol.asyncIterator] === 'function'
  );
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) {
    return e.message;
  }
  if (isObject(e) && 'message' in e) {
    const msg = (e as { message?: unknown }).message;
    return typeof msg === 'string' ? msg : String(msg);
  }
  return String(e);
}

function getErrorCode(e: unknown): string | undefined {
  if (isObject(e) && 'code' in e) {
    const code = (e as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}
