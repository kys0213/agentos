import { BrowserWindow } from 'electron';

export function broadcast(channel: string, payload: unknown) {
  const wins = BrowserWindow.getAllWindows();
  for (const w of wins) {
    if (!w.isDestroyed()) {
      try {
        w.webContents.send(channel, payload);
      } catch {
        // ignore per-window failures
      }
    }
  }
}

