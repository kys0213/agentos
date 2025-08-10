import { ipcMain, IpcMainInvokeEvent } from 'electron';
import type { BuiltinTool } from '@agentos/core';

// 간단한 인메모리 내장 도구 레지스트리 (임시)
const builtinTools = new Map<string, BuiltinTool>();

export function setupBuiltinToolIpcHandlers() {
  ipcMain.handle('builtinTool:get-all', async (_e: IpcMainInvokeEvent) => {
    return Array.from(builtinTools.values());
  });

  ipcMain.handle('builtinTool:get', async (_e: IpcMainInvokeEvent, id: string) => {
    return builtinTools.get(id) ?? null;
  });

  ipcMain.handle(
    'builtinTool:invoke',
    async (_e: IpcMainInvokeEvent, toolName: string, args: Record<string, unknown>) => {
      // TODO: 실제 내장 도구 실행 로직 연결
      return { success: true, result: { toolName, args } } as any;
    }
  );

  console.log('BuiltinTool IPC handlers registered');
}
