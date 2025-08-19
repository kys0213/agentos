import type { RpcClient } from '../../../shared/rpc/transport';
import type { McpUsageLog, McpUsageStats } from '@agentos/core';
import type {
  UsageLogQueryOptions,
  HourlyStatsResponse,
  ClearUsageLogsResponse,
  SetUsageTrackingResponse,
  McpUsageUpdateEvent,
} from '../../../shared/types/mcp-usage-types';

export class McpUsageRpcService {
  constructor(private readonly transport: RpcClient) {}

  getUsageLogs(clientName?: string, options?: UsageLogQueryOptions): Promise<McpUsageLog[]> {
    return this.transport.request('mcp.usage.getLogs', { clientName, options });
  }
  getAllUsageLogs(options?: UsageLogQueryOptions): Promise<McpUsageLog[]> {
    return this.transport.request('mcp.usage.getLogs', { options });
  }
  getUsageStats(clientName?: string): Promise<McpUsageStats> {
    return this.transport.request('mcp.usage.getStats', { clientName });
  }
  getHourlyStats(date: Date, clientName?: string): Promise<HourlyStatsResponse> {
    return this.transport.request('mcp.usage.getHourlyStats', {
      date: date.toISOString(),
      clientName,
    });
  }
  getUsageLogsInRange(startDate: Date, endDate: Date, clientName?: string): Promise<McpUsageLog[]> {
    return this.transport.request('mcp.usage.getLogsInRange', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      clientName,
    });
  }
  clearUsageLogs(olderThan?: Date): Promise<ClearUsageLogsResponse> {
    return this.transport.request(
      'mcp.usage.clear',
      olderThan ? { olderThan: olderThan.toISOString() } : {}
    );
  }
  setUsageTracking(clientName: string, enabled: boolean): Promise<SetUsageTrackingResponse> {
    return this.transport.request('mcpUsageLog:set-usage-tracking', { clientName, enabled });
  }
  async subscribeToUsageUpdates(_callback: (event: McpUsageUpdateEvent) => void): Promise<() => void> {
    // TODO: rewire to frame-level stream or controller if needed
    return async () => {};
  }
}
