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
