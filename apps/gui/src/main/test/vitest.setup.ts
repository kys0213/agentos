import { vi } from 'vitest';

// Provide a global mock for 'electron' in main tests to stabilize boundary behavior
vi.mock('electron', () => {
  // Minimal app mock
  const app = {
    getPath: (name: string) => {
      if (name === 'userData') {
        return '/tmp/agentos-test';
      }
      return '/tmp';
    },
    getName: () => 'AgentOS Test',
    getVersion: () => '0.0.0-test',
  } as const;

  // Minimal BrowserWindow / WebContents mock
  class BrowserWindowMock {
    static instances: BrowserWindowMock[] = [];
    static getAllWindows() {
      return BrowserWindowMock.instances;
    }
    static fromId(_id: number) {
      return new BrowserWindowMock();
    }
    isDestroyed() {
      return false;
    }
    webContents = { send: (_channel: string, _payload: unknown) => {} };
  }

  // Minimal ipcMain mock
  const handlers: Record<
    string,
    ((event: { sender: { id: number } }, payload: unknown) => void)[]
  > = {};
  const ipcMain = {
    on: (channel: string, cb: (event: { sender: { id: number } }, payload: unknown) => void) => {
      handlers[channel] = handlers[channel] || [];
      handlers[channel].push(cb);
    },
    // helper for tests (not used directly but keeps shape extendable)
    __emit: (channel: string, senderId: number, payload: unknown) => {
      for (const cb of handlers[channel] || []) {
        cb({ sender: { id: senderId } }, payload);
      }
    },
  };

  // contextBridge/ipcRenderer are not used in node tests, but provide stubs
  const contextBridge = { exposeInMainWorld: (_k: string, _v: unknown) => {} };
  const ipcRenderer = { on: () => {}, send: () => {} };

  return {
    app,
    BrowserWindow: BrowserWindowMock,
    ipcMain,
    contextBridge,
    ipcRenderer,
  };
});
