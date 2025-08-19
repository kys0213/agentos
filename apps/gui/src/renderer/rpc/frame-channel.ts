import { Observable, filter, share } from 'rxjs';
import type { RpcFrame } from '../../shared/rpc/rpc-frame';

type Bridge = {
  start: (onFrame: (f: RpcFrame) => void) => void;
  post: (f: RpcFrame) => void;
  stop?: () => void;
};

/**
 * Wraps preload bridge into a cold Observable of RpcFrame.
 * Use once and share among consumers to avoid multiple start() invocations.
 */
export function fromBridge$(bridge: Bridge): Observable<RpcFrame> {
  return new Observable<RpcFrame>((sub) => {
    bridge.start((f) => sub.next(f));
    return () => bridge.stop?.();
  }).pipe(share());
}

/**
 * Filters incoming frames by RpcFrame.method (when provided on streaming nxt frames)
 * - exact string: matches equal
 * - prefix string (endsWith('.') recommended): matches startsWith
 * - RegExp: tests against method
 */
export function byMethod(
  pattern: string | RegExp
): (source: Observable<RpcFrame>) => Observable<RpcFrame> {
  return (source) =>
    source.pipe(
      filter((f) => {
        const m = (f as any).method as string | undefined;
        if (!m) return false;
        if (pattern instanceof RegExp) return pattern.test(m);
        return m === pattern || m.startsWith(pattern);
      })
    );
}

/**
 * Convenience selector: stream only data payloads for frames with matching method.
 */
export function selectDataByMethod<T = unknown>(
  pattern: string | RegExp
): (source: Observable<RpcFrame>) => Observable<T> {
  return (source) =>
    source.pipe(
      byMethod(pattern),
      filter((f) => f.kind === 'nxt'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filter((f: any) => 'data' in f)
    ) as unknown as Observable<T>;
}

let seq = 0;
function newCid() {
  return `${Date.now()}-${++seq}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Starts a stream by posting a req frame; returns a cancel function that sends a can frame.
 */
export function startStream(
  bridge: Bridge,
  method: string,
  payload?: unknown,
  meta?: { senderId?: number; rpcSpecVersion?: string; ts?: number }
): () => void {
  const cid = newCid();
  bridge.post({ kind: 'req', cid, method, payload, meta });
  return () => bridge.post({ kind: 'can', cid });
}
