import { app, BrowserWindow, ipcMain } from 'electron';
import * as fs from 'node:fs';
import * as path from 'path';
import { bootstrapIpcMainProcess } from './bootstrapIpcMainProcess';

function configureUserDataPath() {
  const profile = process.env.ELECTRON_TEST_PROFILE;
  if (profile) {
    try {
      fs.mkdirSync(profile, { recursive: true });
      app.setPath('userData', profile);
      const resolved = app.getPath('userData');
      console.log('[main] userData path configured for E2E:', resolved);
    } catch (error) {
      console.error('Failed to set userData path for test profile', error);
    }
  }
}

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

  const isTestProfile = Boolean(process.env.ELECTRON_TEST_PROFILE);

  if (isDevelopment && !isTestProfile) {
    mainWindow.webContents.openDevTools();
  }

  return mainWindow;
}

app.whenReady().then(async () => {
  configureUserDataPath();
  try {
    const mainApp = await bootstrapIpcMainProcess(ipcMain);

    createWindow();

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
