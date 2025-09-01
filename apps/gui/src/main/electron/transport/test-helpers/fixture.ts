import type { IpcMain } from 'electron';
import type { RpcFrame } from '../../../../shared/rpc/rpc-frame';

export type BridgePostHandler = (e: { sender: { id: number } }, frame: RpcFrame) => void;

export function createIpcMainFixture() {
  let handler: BridgePostHandler | null = null;
  const ipcMain: Partial<IpcMain> = {};
  type OnFn = (c: string, l: (event: unknown, ...args: unknown[]) => void) => unknown;
  (ipcMain as { on: OnFn }).on = (
    channel: string,
    listener: (event: unknown, ...args: unknown[]) => void
  ) => {
    if (channel === 'bridge:post') {
      handler = (e, frame) => listener(e, frame);
    }
    return ipcMain;
  };
  return {
    ipcMain: ipcMain as IpcMain,
    emit: (frame: RpcFrame, senderId = 1) => {
      if (!handler) {
        throw new Error('bridge:post listener not registered');
      }
      handler({ sender: { id: senderId } }, frame);
    },
    reset: () => {
      handler = null;
    },
  };
}

export const flush = () => new Promise((r) => setTimeout(r, 0));
