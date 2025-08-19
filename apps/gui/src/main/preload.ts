import { CoreError } from '@agentos/core';
import { contextBridge, ipcRenderer } from 'electron';
import { createElectronBridge, createRpc } from './electron/preload-api';

contextBridge.exposeInMainWorld('electronBridge', createElectronBridge(ipcRenderer as any));

// Generic RPC surface over frame bus for convenience (req/res)
contextBridge.exposeInMainWorld(
  'rpc',
  createRpc(ipcRenderer as any, {
    errorBuilder: (f) =>
      new CoreError(f.domain, f.code, String(f.message ?? 'RPC error'), { details: f.details }),
  })
);
