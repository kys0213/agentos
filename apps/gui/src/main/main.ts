import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { bootstrapIpcMainProcess } from './bootstrapIpcMainProcess';
import { setIncomingFrameHandler, sendTo } from './bridge.ipc';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load the HTML file from dist/renderer directory
  mainWindow.loadFile(path.join(__dirname, '../../dist/renderer/index.html'));

  // Open dev tools in development
  const isDevelopment =
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV !== 'production' ||
    !app.isPackaged;

  if (isDevelopment) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(async () => {
  try {
    const mainApp = await bootstrapIpcMainProcess(ipcMain);

    // Frame-level demo stream handler (prototype): demo.streamTicks
    // Sends 5 incremental ticks then completes. Supports basic cancel.
    setIncomingFrameHandler(async (frame: unknown, senderId: number) => {
      const f = frame as any;
      if (!f || typeof f !== 'object') return;
      if (f.kind !== 'req') return;
      if (f.method !== 'demo.streamTicks') return;
      const count = Math.max(1, Math.min(20, Number(f?.payload?.count ?? 5)));
      for (let i = 1; i <= count; i++) {
        await new Promise((r) => setTimeout(r, 200));
        sendTo(senderId, { kind: 'nxt', cid: f.cid, data: { tick: i } });
      }
      sendTo(senderId, { kind: 'end', cid: f.cid });
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('quit', () => {
      mainApp.close();
    });
  } catch (error) {
    console.error(error);
  }
});
