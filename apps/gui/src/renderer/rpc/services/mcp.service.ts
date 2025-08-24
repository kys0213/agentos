import type { RpcClient } from '../../../shared/rpc/transport';
import type { McpConfig, McpToolMetadata } from '@agentos/core';
import type {
  ResourceListResponse,
  ResourceResponse,
  ToolExecutionResponse,
} from '../../../shared/types/ipc-channel';

export class McpRpcService {
  constructor(private readonly transport: RpcClient) {}

  // NOTE: 다음 메서드들은 향후 컨트롤러 채널 도입 시 dot 표기로 이관 예정
  getAllMcp(): Promise<McpConfig[]> {
    return this.transport.request('mcp.getAll'); // TODO: controller 채널 확정 시 조정
  }
  connectMcp(config: McpConfig): Promise<{ success: boolean }> {
    return this.transport.request('mcp.connect', config); // TODO
  }
  disconnectMcp(name: string): Promise<{ success: boolean }> {
    return this.transport.request('mcp.disconnect', name); // TODO
  }
  // 컨트롤러(mcp.controller.ts)와 일치하는 채널로 실행
  async executeMcpTool(
    _clientName: string,
    toolName: string,
    args: McpToolMetadata
  ): Promise<ToolExecutionResponse> {
    const res = await this.transport.request<
      | { success: true; result: unknown }
      | { success: false; error: string }
    >('mcp.invokeTool', { name: toolName, input: args });
    if (!res.success) throw new Error(res.error || 'mcp.invokeTool failed');
    return { success: true, result: res.result } as unknown as ToolExecutionResponse;
  }
  getMcpResources(clientName: string): Promise<ResourceListResponse> {
    return this.transport.request('mcp.getResources', clientName); // TODO
  }
  readMcpResource(clientName: string, uri: string): Promise<ResourceResponse> {
    return this.transport.request('mcp.readResource', { clientName, uri }); // TODO
  }
  getMcpStatus(clientName: string): Promise<{ connected: boolean; error?: string }> {
    return this.transport.request('mcp.getStatus', clientName); // TODO
  }
  getToolMetadata(clientName: string): Promise<McpToolMetadata> {
    return this.transport.request('mcp.getToolMetadata', clientName); // TODO
  }
  getAllToolMetadata(): Promise<McpToolMetadata[]> {
    return this.transport.request('mcp.getAllToolMetadata'); // TODO
  }

  // New controller-based routes
  getTool(fullyQualifiedName: string) {
    return this.transport.request('mcp.getTool', { name: fullyQualifiedName });
  }
  invokeTool(
    fullyQualifiedName: string,
    input?: Record<string, unknown>,
    opts?: { agentId?: string; agentName?: string; resumptionToken?: string }
  ) {
    return this.transport.request('mcp.invokeTool', {
      name: fullyQualifiedName,
      input,
      agentId: opts?.agentId,
      agentName: opts?.agentName,
      resumptionToken: opts?.resumptionToken,
    });
  }
}
