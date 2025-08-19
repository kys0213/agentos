import type { RpcTransport } from '../../../shared/rpc/transport';
import type { McpConfig, McpToolMetadata } from '@agentos/core';
import type {
  ResourceListResponse,
  ResourceResponse,
  ToolExecutionResponse,
} from '../../../shared/types/ipc-channel';

export class McpRpcService {
  constructor(private readonly transport: RpcTransport) {}

  getAllMcp(): Promise<McpConfig[]> {
    return this.transport.request('mcp:get-all');
  }
  connectMcp(config: McpConfig): Promise<{ success: boolean }> {
    return this.transport.request('mcp:connect', config);
  }
  disconnectMcp(name: string): Promise<{ success: boolean }> {
    return this.transport.request('mcp:disconnect', name);
  }
  executeMcpTool(
    clientName: string,
    toolName: string,
    args: McpToolMetadata
  ): Promise<ToolExecutionResponse> {
    return this.transport.request('mcp:execute-tool', { clientName, toolName, args });
  }
  getMcpResources(clientName: string): Promise<ResourceListResponse> {
    return this.transport.request('mcp:get-resources', clientName);
  }
  readMcpResource(clientName: string, uri: string): Promise<ResourceResponse> {
    return this.transport.request('mcp:read-resource', { clientName, uri });
  }
  getMcpStatus(clientName: string): Promise<{ connected: boolean; error?: string }> {
    return this.transport.request('mcp:get-status', clientName);
  }
  getToolMetadata(clientName: string): Promise<McpToolMetadata> {
    return this.transport.request('mcp:get-tool-metadata', clientName);
  }
  getAllToolMetadata(): Promise<McpToolMetadata[]> {
    return this.transport.request('mcp:get-all-tool-metadata');
  }

  // New controller-based routes
  getTool(fullyQualifiedName: string) {
    return this.transport.request('mcp.getTool', fullyQualifiedName);
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
