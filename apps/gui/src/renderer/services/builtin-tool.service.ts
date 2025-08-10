import type { IpcChannel, BuiltinToolProtocol } from '../../shared/types/ipc-channel';
import type { BuiltinTool } from '@agentos/core';

export class BuiltinToolService implements BuiltinToolProtocol {
  constructor(private ipcChannel: IpcChannel) {}

  getAllBuiltinTools(): Promise<BuiltinTool[]> {
    return this.ipcChannel.getAllBuiltinTools();
  }
  getBuiltinTool(id: string): Promise<BuiltinTool | null> {
    return this.ipcChannel.getBuiltinTool(id);
  }
  invokeBuiltinTool<R>(toolName: string, args: Record<string, any>): Promise<R> {
    return this.ipcChannel.invokeBuiltinTool<R>(toolName, args);
  }
}
