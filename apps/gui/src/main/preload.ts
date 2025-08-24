import { contextBridge, ipcRenderer } from 'electron';
import type { RpcFrame } from '../shared/rpc/rpc-frame';

/**
 * Electron bridge for RPC communication
 */
contextBridge.exposeInMainWorld('electronBridge', {
  start: (onFrame: (f: RpcFrame) => void) => {
    ipcRenderer.on('bridge:frame', (_e, f) => onFrame(f));
  },
  post: (frame: RpcFrame) => {
    ipcRenderer.send('bridge:post', frame);
  },
  stop: () => {
    ipcRenderer.removeAllListeners('bridge:frame');
  },
});
