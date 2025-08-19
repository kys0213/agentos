import type { IpcMain } from 'electron';
import type { RpcFrame } from '../../../../shared/rpc/rpc-frame';

export type BridgePostHandler = (e: { sender: { id: number } }, frame: RpcFrame) => void;

export function createIpcMainFixture() {
  let handler: BridgePostHandler | null = null;
  const ipcMain: Partial<IpcMain> = {};
  (ipcMain as any).on = (channel: string, listener: (event: any, ...args: any[]) => void) => {
    if (channel === 'bridge:post') handler = listener as unknown as BridgePostHandler;
    return ipcMain;
  };
  return {
    ipcMain: ipcMain as IpcMain,
    emit: (frame: RpcFrame, senderId = 1) => {
      if (!handler) throw new Error('bridge:post listener not registered');
      handler({ sender: { id: senderId } }, frame);
    },
    reset: () => {
      handler = null;
    },
  };
}

export const flush = () => new Promise((r) => setTimeout(r, 0));
