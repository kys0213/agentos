import { CustomTransportStrategy, Server } from '@nestjs/microservices';
import { setIncomingFrameHandler, sendTo } from '../bridge.ipc';
import { Observable, isObservable, Subscription } from 'rxjs';

/**
 * Prototype: frame-based transport to support req/res/err/nxt/end/can
 * Not wired yet; safe to keep for later migration.
 */
export class ElectronEventTransport extends Server implements CustomTransportStrategy {
  transportId = Symbol('ElectronTransport');
  private readonly subscriptions = new Map<string, Subscription>();

  // eslint-disable-next-line @typescript-eslint/ban-types
  on<EventKey extends string = string, EventCallback extends Function = Function>(
    event: EventKey,
    callback: EventCallback
  ) {
    throw new Error('Method not implemented.');
  }
  unwrap<T>(): T {
    throw new Error('Method not implemented.');
  }
  listen(cb: () => void) {
    setIncomingFrameHandler(async (frame: unknown, senderId: number) => {
      try {
        const f = frame as any;
        if (f?.kind === 'can') {
          const sub = this.subscriptions.get(f.cid);
          sub?.unsubscribe();
          this.subscriptions.delete(f.cid);
          return;
        }
        if (f?.kind !== 'req') return;
        const handler = this.messageHandlers.get(f.method);
        if (!handler) {
          return sendTo(senderId, {
            kind: 'err',
            cid: f.cid,
            ok: false,
            message: 'NO_HANDLER',
            code: 'NOT_FOUND',
            domain: 'common',
          });
        }

        const out = await handler(f.payload, { senderId });
        if (isObservable(out)) {
          const sub = (out as Observable<any>).subscribe({
            next: (v) => sendTo(senderId, { kind: 'nxt', cid: f.cid, data: v }),
            error: (e) =>
              sendTo(senderId, {
                kind: 'err',
                cid: f.cid,
                ok: false,
                message: String(e),
                code: 'OPERATION_FAILED',
                domain: 'common',
              }),
            complete: () => {
              sendTo(senderId, { kind: 'end', cid: f.cid });
              this.subscriptions.delete(f.cid);
            },
          });
          this.subscriptions.set(f.cid, sub);
          return;
        }

        if (out && typeof (out as any)[Symbol.asyncIterator] === 'function') {
          for await (const chunk of out as AsyncIterable<any>) {
            sendTo(senderId, { kind: 'nxt', cid: f.cid, data: chunk });
          }
          return sendTo(senderId, { kind: 'end', cid: f.cid });
        }

        return sendTo(senderId, { kind: 'res', cid: f.cid, ok: true, result: out });
      } catch (e: any) {
        const asCore = e as { code?: string; domain?: string; message?: string; details?: unknown };
        return sendTo(senderId, {
          kind: 'err',
          cid: (frame as any)?.cid,
          ok: false,
          message: String(e?.message ?? e),
          code: (asCore as any)?.code ?? 'INTERNAL',
          domain: (asCore as any)?.domain ?? 'common',
          details: (asCore as any)?.details,
        });
      }
    });
    cb();
  }

  close() {}
}
