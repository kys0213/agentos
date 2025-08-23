import type { BuiltinTool } from '@agentos/core';
import type { BuiltinToolProtocol } from '../../shared/types/builtin-protocol';
import type { RpcClient } from '../../shared/rpc/transport';

// TODO 내장 도구 서비스 구현
export class BuiltinToolService implements BuiltinToolProtocol {
  constructor(private rpcTransport: RpcClient) {}

  async getAllBuiltinTools(): Promise<BuiltinTool[]> {
    return [];
  }
  async getBuiltinTool(_id: string): Promise<BuiltinTool | null> {
    return null;
  }
  async invokeBuiltinTool<R>(_toolName: string, _args: Record<string, unknown>): Promise<R> {
    return {} as R; // TODO: wire to main once BuiltinToolController is ready
  }
}
