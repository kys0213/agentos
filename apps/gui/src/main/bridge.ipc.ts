import { BrowserWindow, ipcMain, WebContents } from 'electron';

type IncomingHandler = (frame: unknown, senderId: number) => void | Promise<void>;

let onIncomingFrame: IncomingHandler | null = null;

export function setIncomingFrameHandler(handler: IncomingHandler) {
  onIncomingFrame = handler;
}

// Listen for frame posts from renderer processes
ipcMain.on('bridge:post', (e, frame) => {
  try {
    onIncomingFrame?.(frame, e.sender.id);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('bridge:post handler error', err);
  }
});

export function sendTo(wcId: number, frame: unknown) {
  BrowserWindow.fromWebContentsId(wcId)?.webContents.send('bridge:frame', frame);
}

export function sendToWebContents(wc: WebContents, frame: unknown) {
  wc.send('bridge:frame', frame);
}

