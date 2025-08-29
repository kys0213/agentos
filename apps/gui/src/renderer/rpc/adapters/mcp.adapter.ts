import type { McpProtocol, ToolExecutionResponse, ResourceListResponse, ResourceResponse } from '../../../shared/types/mcp-protocol';
import { McpClient } from '../gen/mcp.client';

export class McpServiceAdapter implements McpProtocol {
  constructor(private readonly client: McpClient) {}

  // Minimal mapping using invokeTool/getTool when possible. Others are placeholders.

  async getAllMcp() {
    return [];
  }

  async connectMcp(_config: unknown) {
    return { success: false };
  }

  async disconnectMcp(_name: string) {
    return { success: false };
  }

  async executeMcpTool(_clientName: string, toolName: string, args: Record<string, unknown>): Promise<ToolExecutionResponse> {
    const res = await this.client.invokeTool({ name: toolName, input: args });
    if ((res as any)?.success) return { success: true, result: (res as any).result };
    return { success: false, error: (res as any)?.error ?? 'invokeTool failed' };
  }

  async getMcpResources(_clientName: string): Promise<ResourceListResponse> {
    return { resources: [] };
  }

  async readMcpResource(_clientName: string, _uri: string): Promise<ResourceResponse> {
    return { uri: '', content: '', mimeType: 'text/plain' };
  }

  async getMcpStatus(_clientName: string) {
    return { connected: false };
  }

  async getToolMetadata(_clientName: string) {
    return {} as any;
  }

  async getAllToolMetadata() {
    return [] as any;
  }
}

