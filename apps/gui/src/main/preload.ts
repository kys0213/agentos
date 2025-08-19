import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronBridge', {
  start: (onFrame) => {
    ipcRenderer.on('bridge:frame', (_e, f) => onFrame(f));
  },
  post: (frame) => {
    ipcRenderer.send('bridge:post', frame);
  },
  on: (channel: string, handler: (payload: unknown) => void) => {
    const wrapped = (_e: unknown, payload: unknown) => handler(payload);
    ipcRenderer.on(channel, wrapped);
    return () => ipcRenderer.off(channel, wrapped);
  },
});

// Generic RPC surface over frame bus for convenience (req/res)
contextBridge.exposeInMainWorld('rpc', {
  request: (channel: string, payload?: unknown): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      const cid = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const onFrame = (_e: unknown, f: any) => {
        if (!f || f.cid !== cid) return;
        if (f.kind === 'res' && f.ok === true) {
          ipcRenderer.off('bridge:frame', onFrame as any);
          resolve(f.result);
        } else if (f.kind === 'err') {
          ipcRenderer.off('bridge:frame', onFrame as any);
          const err = new Error(String(f.message ?? 'RPC error')) as any;
          err.code = f.code;
          err.domain = f.domain;
          err.details = f.details;
          reject(err);
        }
      };
      ipcRenderer.on('bridge:frame', onFrame as any);
      ipcRenderer.send('bridge:post', {
        kind: 'req',
        cid,
        method: channel,
        payload,
        meta: { rpcSpecVersion: '0.2', ts: Date.now() },
      });
    });
  },
});
