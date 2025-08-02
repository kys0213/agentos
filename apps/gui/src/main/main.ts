import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { setupCoreIpcHandlers } from './core-api';

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

app.whenReady().then(() => {
  // Setup IPC handlers (dependencies are managed internally)
  setupCoreIpcHandlers();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
