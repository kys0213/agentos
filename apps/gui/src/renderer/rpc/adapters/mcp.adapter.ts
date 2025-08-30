type ToolExecutionResponse = { success: true; result?: unknown } | { success: false; error: string };
type ResourceListResponse = { resources: Array<unknown> };
type ResourceResponse = { uri: string; content: unknown; mimeType: string };
import { McpClient } from '../gen/mcp.client';
import { McpContract as C } from '../../../shared/rpc/contracts/mcp.contract';

export class McpServiceAdapter {
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

  async executeMcpTool(
    _clientName: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<ToolExecutionResponse> {
    const payload = C.methods['invokeTool'].payload.parse({ name: toolName, input: args });
    const parsed = C.methods['invokeTool'].response.parse(await this.client.invokeTool(payload));
    return parsed.success ? { success: true, result: parsed.result } : { success: false, error: parsed.error };
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

  async getToolMetadata(_clientName: string): Promise<Record<string, unknown>> {
    return {} as Record<string, unknown>;
  }

  async getAllToolMetadata(): Promise<Record<string, unknown>[]> {
    return [] as Record<string, unknown>[];
  }
}
