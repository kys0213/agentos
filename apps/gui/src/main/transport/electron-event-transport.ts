import { CustomTransportStrategy, Server } from '@nestjs/microservices';
import { setIncomingFrameHandler, sendTo } from '../bridge.ipc';
import { Observable, isObservable } from 'rxjs';

/**
 * Prototype: frame-based transport to support req/res/err/nxt/end/can
 * Not wired yet; safe to keep for later migration.
 */
export class ElectronEventTransport extends Server implements CustomTransportStrategy {
  listen(cb: () => void) {
    setIncomingFrameHandler(async (frame: any, senderId: number) => {
      try {
        if (frame?.kind !== 'req') return;
        const handler = this.messageHandlers.get(frame.method);
        if (!handler) {
          return sendTo(senderId, {
            kind: 'err',
            cid: frame.cid,
            ok: false,
            message: 'NO_HANDLER',
            code: 'NOT_FOUND',
            domain: 'common',
          });
        }

        const out = await handler(frame.payload, { senderId });
        if (isObservable(out)) {
          const sub = (out as Observable<any>).subscribe({
            next: (v) => sendTo(senderId, { kind: 'nxt', cid: frame.cid, data: v }),
            error: (e) => sendTo(senderId, { kind: 'err', cid: frame.cid, ok: false, message: String(e), code: 'OPERATION_FAILED', domain: 'common' }),
            complete: () => sendTo(senderId, { kind: 'end', cid: frame.cid }),
          });
          // TODO: handle cancel frames to unsubscribe
          return sub;
        }

        if (out && typeof out[Symbol.asyncIterator] === 'function') {
          for await (const chunk of out as AsyncIterable<any>) {
            sendTo(senderId, { kind: 'nxt', cid: frame.cid, data: chunk });
          }
          return sendTo(senderId, { kind: 'end', cid: frame.cid });
        }

        return sendTo(senderId, { kind: 'res', cid: frame.cid, ok: true, result: out });
      } catch (e: any) {
        const asCore = e as { code?: string; domain?: string; message?: string; details?: unknown };
        return sendTo(senderId, {
          kind: 'err',
          cid: frame?.cid,
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

