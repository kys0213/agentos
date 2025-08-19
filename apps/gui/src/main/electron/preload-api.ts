// Testable factory for preload-exposed APIs without importing 'electron'.

export interface IpcLike {
  on: (channel: string, listener: (event: unknown, payload: any) => void) => void;
  off: (channel: string, listener: (event: unknown, payload: any) => void) => void;
  send: (channel: string, payload: any) => void;
}

export type Frame =
  | { kind: 'req'; cid: string; method: string; payload?: unknown; meta?: Record<string, unknown> }
  | { kind: 'res'; cid: string; ok: true; result?: unknown }
  | { kind: 'err'; cid: string; ok: false; message?: string; code?: string; domain?: string; details?: any };

export function createElectronBridge(ipc: IpcLike) {
  return {
    start: (onFrame: (f: Frame) => void) => {
      ipc.on('bridge:frame', (_e, f) => onFrame(f));
    },
    post: (frame: Frame) => {
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
  opts?: { specVersion?: string; errorBuilder?: (f: any) => Error }
) {
  const spec = opts?.specVersion ?? '0.2';
  return {
    request: (channel: string, payload?: unknown): Promise<unknown> => {
      return new Promise((resolve, reject) => {
        const cid = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        const onFrame = (_e: unknown, f: any) => {
          if (!f || f.cid !== cid) return;
          if (f.kind === 'res' && f.ok === true) {
            ipc.off('bridge:frame', onFrame as any);
            resolve(f.result);
          } else if (f.kind === 'err') {
            ipc.off('bridge:frame', onFrame as any);
            const err = opts?.errorBuilder
              ? opts.errorBuilder(f)
              : Object.assign(new Error(String(f.message ?? 'RPC error')), {
                  code: f.code,
                  domain: f.domain,
                  details: f.details,
                });
            reject(err as Error);
          }
        };
        ipc.on('bridge:frame', onFrame as any);
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
