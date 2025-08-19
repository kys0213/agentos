import type { BuiltinTool } from '@agentos/core';
import type { BuiltinToolProtocol } from '../../shared/types/builtin-protocol';
import type { RpcTransport } from '../../shared/rpc/transport';

// TODO 내장 도구 서비스 구현
export class BuiltinToolService implements BuiltinToolProtocol {
  constructor(private rpcTransport: RpcTransport) {}

  async getAllBuiltinTools(): Promise<BuiltinTool[]> {
    return [];
  }
  async getBuiltinTool(id: string): Promise<BuiltinTool | null> {
    return null;
  }
  async invokeBuiltinTool<R>(toolName: string, args: Record<string, any>): Promise<R> {
    return {} as R;
  }
}
