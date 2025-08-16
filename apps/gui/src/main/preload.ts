import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronBridge', {
  start: (onFrame) => {
    ipcRenderer.on('bridge:frame', (_e, f) => onFrame(f));
  },
  post: (frame) => {
    ipcRenderer.send('bridge:post', frame);
  },
});
