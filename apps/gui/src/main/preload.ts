import { contextBridge, ipcRenderer } from 'electron';
import { createElectronBridge, createRpc } from './electron/preload-api';

contextBridge.exposeInMainWorld('electronBridge', createElectronBridge(ipcRenderer));

// Generic RPC surface over frame bus for convenience (req/res)
contextBridge.exposeInMainWorld('rpc', createRpc(ipcRenderer));
