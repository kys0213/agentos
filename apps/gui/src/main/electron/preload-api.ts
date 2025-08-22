// Testable factory for preload-exposed APIs without importing 'electron'.

import { RpcFrame } from '../../shared/rpc/rpc-frame';

export interface IpcLike {
  on<T = unknown>(channel: string, listener: (event: unknown, payload: T) => void): void;
  off<T = unknown>(channel: string, listener: (event: unknown, payload: T) => void): void;
  send<T = unknown>(channel: string, payload: T): void;
}

export function createElectronBridge(ipc: IpcLike) {
  return {
    start: (onFrame: (f: RpcFrame) => void) => {
      ipc.on<RpcFrame>('bridge:frame', (_e, f) => onFrame(f));
    },
    post: (frame: RpcFrame) => {
      ipc.send('bridge:post', frame);
    },
    on: (channel: string, handler: (payload: unknown) => void) => {
      const wrapped = (_e: unknown, payload: unknown) => handler(payload);
      ipc.on(channel, wrapped);
      return () => ipc.off(channel, wrapped);
    },
  } as const;
}

export function createRpc(
  ipc: IpcLike,
  opts?: { specVersion?: string; toError?: (f: RpcFrame) => Error }
) {
  const spec = opts?.specVersion ?? '0.2';
  return {
    request: (channel: string, payload?: unknown): Promise<unknown> => {
      return new Promise((resolve, reject) => {
        const cid = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        const onFrame = (_e: unknown, f: RpcFrame) => {
          if (!f || f.cid !== cid) {
            return;
          }
          if (f.kind === 'res' && f.ok === true) {
            ipc.off('bridge:frame', onFrame);
            resolve(f.result);
          } else if (f.kind === 'err') {
            ipc.off('bridge:frame', onFrame);
            const err = opts?.toError
              ? opts.toError(f)
              : Object.assign(new Error(String(f.message ?? 'RPC error')), {
                  code: f.code,
                  details: f.details,
                });
            reject(err as Error);
          }
        };
        ipc.on<RpcFrame>('bridge:frame', onFrame);
        ipc.send('bridge:post', {
          kind: 'req',
          cid,
          method: channel,
          payload,
          meta: { rpcSpecVersion: spec, ts: Date.now() },
        });
      });
    },
  } as const;
}
