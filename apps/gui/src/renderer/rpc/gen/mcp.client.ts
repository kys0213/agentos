import type { RpcClient } from '../../../shared/rpc/transport';
import { Channels } from '../../../shared/rpc/gen/channels';

/** AUTO-GENERATED FILE. DO NOT EDIT. */
export class McpClient {
  constructor(private readonly transport: RpcClient) {}

  getTool(name: string): Promise<unknown> {
    return this.transport.request(Channels.mcp.getTool, { name });
  }
  invokeTool(name: string, input?: Record<string, unknown>, opts?: { agentId?: string; agentName?: string; resumptionToken?: string }): Promise<unknown> {
    return this.transport.request(Channels.mcp.invokeTool, { name, input, ...opts });
  }

  usage_getLogs(payload?: { query?: Record<string, unknown>; pg?: Record<string, unknown> }): Promise<unknown[]> {
    return this.transport.request(Channels.mcp.usage_getLogs, payload);
  }
  usage_getStats(payload?: { query?: Record<string, unknown> }): Promise<unknown> {
    return this.transport.request(Channels.mcp.usage_getStats, payload);
  }
  usage_getHourlyStats(date: Date, clientName?: string): Promise<{ hourlyData: Array<[number, number]> }> {
    return this.transport.request(Channels.mcp.usage_getHourlyStats, { date: date.toISOString(), clientName });
  }
  usage_clear(olderThan?: Date): Promise<{ success: boolean; error?: string }> {
    return this.transport.request(Channels.mcp.usage_clear, olderThan ? { olderThan: olderThan.toISOString() } : {});
  }
}

